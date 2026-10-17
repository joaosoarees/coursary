import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import type { Account } from '@application/entities/account/Account';
import {
  type Course,
  courseStatuses,
} from '@application/entities/course/Course';
import { Conflict } from '@application/errors/common';
import {
  CourseArchived,
  CourseEmpty,
  CourseNotFound,
  CourseNotPublished,
} from '@application/errors/course';
import type { CourseRepository } from '@application/repositories/course/CourseRepository';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { copyName } from '@infra/database/dynamo/copyName';
import { DynamoUnitOfWork } from '@infra/database/dynamo/DynamoUnitOfWork';
import { CourseDescriptionItem } from '@infra/database/dynamo/items/course/CourseDescriptionItem';
import { CourseItem } from '@infra/database/dynamo/items/course/CourseItem';
import { queryAll } from '@infra/database/dynamo/queryAll';
import type { AppConfig } from '@shared/config/AppConfig';

export class DynamoCourseRepository implements CourseRepository {
  constructor(private readonly config: AppConfig) {}

  async create(course: Course, description = ''): Promise<void> {
    const put = {
      TableName: this.config.mainTableName,
      Item: CourseItem.fromEntity(course).toItem(),
      ConditionExpression: 'attribute_not_exists(PK)',
    };

    if (!description) {
      await dynamoClient.send(new PutCommand(put));

      return;
    }

    const unit = new DynamoUnitOfWork();
    unit.add(
      DynamoUnitOfWork.operation({ Put: put }),
      this.putDescriptionOperation(course.id, description),
    );
    await unit.commit();
  }

  async findById(id: Course.Id): Promise<Course | null> {
    const command = new GetCommand({
      TableName: this.config.mainTableName,
      Key: { PK: CourseItem.getPK(id), SK: CourseItem.getSK(id) },
    });

    const { Item } = await dynamoClient.send(command);

    return Item ? CourseItem.toEntity(Item as CourseItem.ItemType) : null;
  }

  async findDescription(id: Course.Id): Promise<string> {
    const command = new GetCommand({
      TableName: this.config.mainTableName,
      Key: {
        PK: CourseDescriptionItem.getPK(id),
        SK: CourseDescriptionItem.getSK(),
      },
    });

    const { Item } = await dynamoClient.send(command);

    return CourseDescriptionItem.toDescription(
      Item as CourseDescriptionItem.ItemType | undefined,
    );
  }

  // Both writes hold to a course that exists and is not archived (Q309).
  async update(course: Course, changes: Course.Changes): Promise<void> {
    const condition = {
      ConditionExpression: 'attribute_exists(PK) AND #status <> :archived',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':archived': courseStatuses.Archived },
      ReturnValuesOnConditionCheckFailure: 'ALL_OLD' as const,
    };
    const key = this.keyOf(course);

    if (changes.description === undefined) {
      try {
        await dynamoClient.send(
          new UpdateCommand({
            TableName: this.config.mainTableName,
            Key: key,
            UpdateExpression: 'SET title = :title',
            ...condition,
            ExpressionAttributeValues: {
              ...condition.ExpressionAttributeValues,
              ':title': changes.title,
            },
          }),
        );
      } catch (error) {
        if (error instanceof ConditionalCheckFailedException) {
          throw error.Item ? new CourseArchived() : new CourseNotFound();
        }

        throw error;
      }

      return;
    }

    const courseOperation =
      changes.title === undefined
        ? {
            ConditionCheck: {
              TableName: this.config.mainTableName,
              Key: key,
              ...condition,
            },
          }
        : {
            Update: {
              TableName: this.config.mainTableName,
              Key: key,
              UpdateExpression: 'SET title = :title',
              ...condition,
              ExpressionAttributeValues: {
                ...condition.ExpressionAttributeValues,
                ':title': changes.title,
              },
            },
          };
    const unit = new DynamoUnitOfWork();
    unit.add(
      DynamoUnitOfWork.operation(courseOperation, (stored) =>
        stored ? new CourseArchived() : new CourseNotFound(),
      ),
      changes.description
        ? this.putDescriptionOperation(course.id, changes.description)
        : DynamoUnitOfWork.operation({
            Delete: {
              TableName: this.config.mainTableName,
              Key: {
                PK: CourseDescriptionItem.getPK(course.id),
                SK: CourseDescriptionItem.getSK(),
              },
            },
          }),
    );
    await unit.commit();
  }

  async publish(id: Course.Id, publishedAt: Date): Promise<Course> {
    const at = publishedAt.toISOString();
    const command = new UpdateCommand({
      TableName: this.config.mainTableName,
      Key: { PK: CourseItem.getPK(id), SK: CourseItem.getSK(id) },
      UpdateExpression:
        'SET #status = :published, publishedAt = :at, GSI2PK = :gsi2pk, GSI2SK = :gsi2sk',
      ConditionExpression: '#status = :draft AND lessonCount > :none',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':published': courseStatuses.Published,
        ':draft': courseStatuses.Draft,
        ':none': 0,
        ':at': at,
        ':gsi2pk': CourseItem.getGSI2PK(),
        ':gsi2sk': CourseItem.getGSI2SK(at, id),
      },
      ReturnValues: 'ALL_NEW',
      ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
    });

    try {
      const { Attributes } = await dynamoClient.send(command);

      return CourseItem.toEntity(Attributes as CourseItem.ItemType);
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        throw DynamoCourseRepository.refusal(error, new CourseEmpty());
      }

      throw error;
    }
  }

  async archive(id: Course.Id): Promise<Course> {
    const command = new UpdateCommand({
      TableName: this.config.mainTableName,
      Key: { PK: CourseItem.getPK(id), SK: CourseItem.getSK(id) },
      UpdateExpression: 'SET #status = :archived REMOVE GSI2PK, GSI2SK',
      ConditionExpression: '#status = :published',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':archived': courseStatuses.Archived,
        ':published': courseStatuses.Published,
      },
      ReturnValues: 'ALL_NEW',
      ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
    });

    try {
      const { Attributes } = await dynamoClient.send(command);

      return CourseItem.toEntity(Attributes as CourseItem.ItemType);
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        throw DynamoCourseRepository.refusal(error, new CourseNotPublished());
      }

      throw error;
    }
  }

  // Copies the name into every course of the instructor (Q207, Q290).
  async updateInstructorName(
    instructorId: Account.Id,
    name: string,
  ): Promise<void> {
    await copyName({
      tableName: this.config.mainTableName,
      keys: await this.courseKeysOf(instructorId),
      attribute: 'instructorName',
      name,
    });
  }

  statusUnchangedOperation(course: Course): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation({
      ConditionCheck: {
        TableName: this.config.mainTableName,
        Key: this.keyOf(course),
        ConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': course.status },
      },
    });
  }

  addLessonsOperation(course: Course, delta: number): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation({
      Update: {
        TableName: this.config.mainTableName,
        Key: this.keyOf(course),
        UpdateExpression: 'ADD lessonCount :delta',
        ConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':delta': delta,
          ':status': course.status,
        },
      },
    });
  }

  addEnrollmentsOperation(
    course: Course,
    delta: number,
    { requirePublished }: CourseRepository.EnrollmentCountOptions,
  ): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation({
      Update: {
        TableName: this.config.mainTableName,
        Key: this.keyOf(course),
        UpdateExpression: 'ADD enrollmentCount :delta',
        ConditionExpression: requirePublished
          ? '#status = :published'
          : 'attribute_exists(PK)',
        ...(requirePublished
          ? {
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':delta': delta,
                ':published': courseStatuses.Published,
              },
            }
          : { ExpressionAttributeValues: { ':delta': delta } }),
      },
    });
  }

  addRatingsOperation(
    course: Course,
    { sumDelta, countDelta }: CourseRepository.RatingDeltas,
  ): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation({
      Update: {
        TableName: this.config.mainTableName,
        Key: this.keyOf(course),
        UpdateExpression: 'ADD ratingSum :sum, ratingCount :count',
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeValues: { ':sum': sumDelta, ':count': countDelta },
      },
    });
  }

  private putDescriptionOperation(
    courseId: Course.Id,
    description: string,
  ): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation({
      Put: {
        TableName: this.config.mainTableName,
        Item: new CourseDescriptionItem({ courseId, description }).toItem(),
      },
    });
  }

  private keyOf(course: Course) {
    return { PK: CourseItem.getPK(course.id), SK: CourseItem.getSK(course.id) };
  }

  private async courseKeysOf(
    instructorId: Account.Id,
  ): Promise<Record<string, unknown>[]> {
    const keys = (await queryAll({
      TableName: this.config.mainTableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': CourseItem.getGSI1PK(instructorId),
      },
      ProjectionExpression: 'PK, SK',
    })) as Record<string, unknown>[];

    return keys;
  }

  // The item as it was when the condition failed tells why (Q232, Q233).
  private static refusal(
    error: ConditionalCheckFailedException,
    whenDraft: Error,
  ): Error {
    if (!error.Item) {
      return new CourseNotFound();
    }

    switch (error.Item.status?.S) {
      case courseStatuses.Archived:
        return new CourseArchived();
      case courseStatuses.Draft:
        return whenDraft;
      default:
        return new Conflict();
    }
  }
}
