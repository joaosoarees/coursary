import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import type { Account } from '@application/entities/Account';
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

  // Copies the name into every course of the instructor, at most 100 per
  // transaction; calling it again with the same name finishes what a failure left.
  async updateInstructorName(
    instructorId: Account.Id,
    name: string,
  ): Promise<void> {
    const TableName = this.config.mainTableName;
    const keys = await this.courseKeysOf(instructorId);

    for (let start = 0; start < keys.length; start += 100) {
      const command = new TransactWriteCommand({
        TransactItems: keys.slice(start, start + 100).map((Key) => ({
          Update: {
            TableName,
            Key,
            UpdateExpression: 'SET instructorName = :name',
            ConditionExpression: 'instructorId = :instructorId',
            ExpressionAttributeValues: {
              ':name': name,
              ':instructorId': instructorId,
            },
          },
        })),
      });

      await dynamoClient.send(command);
    }
  }

  private async courseKeysOf(
    instructorId: Account.Id,
  ): Promise<Record<string, unknown>[]> {
    const keys: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const command = new QueryCommand({
        TableName: this.config.mainTableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': CourseItem.getGSI1PK(instructorId),
        },
        ProjectionExpression: 'PK, SK',
        ExclusiveStartKey,
      });
      const page = await dynamoClient.send(command);
      keys.push(...(page.Items ?? []));
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return keys;
  }
}
