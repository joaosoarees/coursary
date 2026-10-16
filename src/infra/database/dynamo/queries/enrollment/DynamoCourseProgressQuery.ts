import { QueryCommand } from '@aws-sdk/lib-dynamodb';

import type { CourseProgressQuery } from '@application/queries/enrollment/CourseProgressQuery';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { CoursePositionItem } from '@infra/database/dynamo/items/enrollment/CoursePositionItem';
import { LessonProgressItem } from '@infra/database/dynamo/items/enrollment/LessonProgressItem';
import type { AppConfig } from '@shared/config/AppConfig';

type ProgressItem = CoursePositionItem.ItemType | LessonProgressItem.ItemType;

// The position and every completed lesson of the course share the prefix
// `PROGRESS#<courseId>` in the student's partition: one Query reads both (Q279).
export class DynamoCourseProgressQuery implements CourseProgressQuery {
  constructor(private readonly config: AppConfig) {}

  async execute({
    accountId,
    courseId,
  }: CourseProgressQuery.Input): Promise<CourseProgressQuery.Result> {
    const items: ProgressItem[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const command = new QueryCommand({
        TableName: this.config.mainTableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
        ExpressionAttributeValues: {
          ':pk': CoursePositionItem.getPK(accountId),
          ':prefix': CoursePositionItem.getSK(courseId),
        },
        ExclusiveStartKey,
      });
      const page = await dynamoClient.send(command);
      items.push(...((page.Items ?? []) as ProgressItem[]));
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    const position = items.find(
      (item): item is CoursePositionItem.ItemType =>
        item.type === CoursePositionItem.type,
    );

    return {
      completedLessonIds: items.flatMap((item) =>
        item.type === LessonProgressItem.type ? [item.lessonId] : [],
      ),
      lastLessonId: position?.lessonId ?? null,
      positionSeconds: position?.positionSeconds ?? null,
    };
  }
}
