import { QueryCommand } from '@aws-sdk/lib-dynamodb';

import {
  type Course,
  courseStatuses,
} from '@application/entities/course/Course';
import type { CoursePageQuery } from '@application/queries/catalog/CoursePageQuery';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { CourseItem } from '@infra/database/dynamo/items/course/CourseItem';
import { DynamoCourseOutlineQuery } from '@infra/database/dynamo/queries/outline/DynamoCourseOutlineQuery';
import type { AppConfig } from '@shared/config/AppConfig';

// The course and its outline share one partition, so one query reads them (pattern 6).
export class DynamoCoursePageQuery implements CoursePageQuery {
  constructor(private readonly config: AppConfig) {}

  async execute(courseId: Course.Id): Promise<CoursePageQuery.Page | null> {
    const items: { type: string }[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const command = new QueryCommand({
        TableName: this.config.mainTableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': CourseItem.getPK(courseId) },
        ExclusiveStartKey,
      });
      const page = await dynamoClient.send(command);
      items.push(...((page.Items ?? []) as { type: string }[]));
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    const course = items.find(
      (item): item is CourseItem.ItemType => item.type === CourseItem.type,
    );

    if (course?.status !== courseStatuses.Published) {
      return null;
    }

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      instructorName: course.instructorName,
      lessonCount: course.lessonCount,
      enrollmentCount: course.enrollmentCount,
      publishedAt: course.publishedAt ?? '',
      ...DynamoCourseOutlineQuery.toOutline(items),
    };
  }
}
