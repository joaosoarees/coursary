import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { type Course, courseStatuses } from '@application/entities/Course';
import { CourseArchived } from '@application/errors/CourseArchived';
import { CourseNotFound } from '@application/errors/CourseNotFound';
import type { CourseRepository } from '@application/repositories/CourseRepository';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { CourseItem } from '@infra/database/dynamo/items/CourseItem';
import type { AppConfig } from '@shared/config/AppConfig';

export class DynamoCourseRepository implements CourseRepository {
  constructor(private readonly config: AppConfig) {}

  async create(course: Course): Promise<void> {
    const command = new PutCommand({
      TableName: this.config.mainTableName,
      Item: CourseItem.fromEntity(course).toItem(),
      ConditionExpression: 'attribute_not_exists(PK)',
    });

    await dynamoClient.send(command);
  }

  async findById(id: Course.Id): Promise<Course | null> {
    const command = new GetCommand({
      TableName: this.config.mainTableName,
      Key: { PK: CourseItem.getPK(id), SK: CourseItem.getSK(id) },
    });

    const { Item } = await dynamoClient.send(command);

    return Item ? CourseItem.toEntity(Item as CourseItem.ItemType) : null;
  }

  async update(id: Course.Id, changes: Course.Changes): Promise<Course> {
    const fields = Object.entries(changes).filter(
      ([, value]) => value !== undefined,
    );
    const command = new UpdateCommand({
      TableName: this.config.mainTableName,
      Key: { PK: CourseItem.getPK(id), SK: CourseItem.getSK(id) },
      UpdateExpression: `SET ${fields.map(([name]) => `#${name} = :${name}`).join(', ')}`,
      ConditionExpression: 'attribute_exists(PK) AND #status <> :archived',
      ExpressionAttributeNames: {
        '#status': 'status',
        ...Object.fromEntries(fields.map(([name]) => [`#${name}`, name])),
      },
      ExpressionAttributeValues: {
        ':archived': courseStatuses.Archived,
        ...Object.fromEntries(
          fields.map(([name, value]) => [`:${name}`, value]),
        ),
      },
      ReturnValues: 'ALL_NEW',
      ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
    });

    try {
      const { Attributes } = await dynamoClient.send(command);

      return CourseItem.toEntity(Attributes as CourseItem.ItemType);
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        throw error.Item ? new CourseArchived() : new CourseNotFound();
      }

      throw error;
    }
  }
}
