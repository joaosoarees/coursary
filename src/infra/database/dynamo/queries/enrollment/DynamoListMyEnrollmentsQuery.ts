import { BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

import type { Page } from '@application/contracts/Page';
import type { Course } from '@application/entities/course/Course';
import { EnrollmentSummary } from '@application/queries/enrollment/EnrollmentSummary';
import type { ListMyEnrollmentsQuery } from '@application/queries/enrollment/ListMyEnrollmentsQuery';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { DynamoPagination } from '@infra/database/dynamo/DynamoPagination';
import { CourseItem } from '@infra/database/dynamo/items/course/CourseItem';
import { EnrollmentItem } from '@infra/database/dynamo/items/enrollment/EnrollmentItem';
import type { AppConfig } from '@shared/config/AppConfig';

// The student's active enrollments from GSI2 (Q268), each with its course read
// by BatchGet (Q80, Q269): title, instructor and lesson count stay references.
export class DynamoListMyEnrollmentsQuery implements ListMyEnrollmentsQuery {
  static readonly maxBatchRounds = 3;

  constructor(private readonly config: AppConfig) {}

  async execute({
    accountId,
    page,
  }: ListMyEnrollmentsQuery.Input): Promise<Page<EnrollmentSummary>> {
    const GSI2PK = EnrollmentItem.getGSI2PK(accountId);
    const pagination = new DynamoPagination(
      z.strictObject({
        GSI2PK: z.literal(GSI2PK),
        GSI2SK: z.string().min(1),
        PK: z.literal(EnrollmentItem.getPK(accountId)),
        SK: z.string().startsWith('ENROLLMENT#'),
      }),
    );

    const { items, nextCursor } =
      await pagination.queryPage<EnrollmentItem.ItemType>(
        {
          TableName: this.config.mainTableName,
          IndexName: 'GSI2',
          KeyConditionExpression: 'GSI2PK = :pk',
          ExpressionAttributeValues: { ':pk': GSI2PK },
          ScanIndexForward: false,
        },
        page,
      );
    const courses = await this.coursesOf(items.map((item) => item.courseId));

    return {
      items: items.flatMap((item) => {
        const course = courses.get(item.courseId);

        if (!course) {
          console.warn(
            JSON.stringify({
              event: 'EnrollmentWithoutCourse',
              accountId,
              courseId: item.courseId,
            }),
          );
          return [];
        }

        return [
          EnrollmentSummary.fromEnrollment(
            EnrollmentItem.toEntity(item),
            course,
          ),
        ];
      }),
      nextCursor,
    };
  }

  private async coursesOf(ids: Course.Id[]): Promise<Map<string, Course>> {
    const TableName = this.config.mainTableName;
    const courses = new Map<string, Course>();
    let keys: Record<string, unknown>[] = ids.map((id) => ({
      PK: CourseItem.getPK(id),
      SK: CourseItem.getSK(id),
    }));

    for (
      let round = 0;
      keys.length > 0 && round < DynamoListMyEnrollmentsQuery.maxBatchRounds;
      round++
    ) {
      if (round > 0) {
        await new Promise((resolve) => setTimeout(resolve, 50 * 2 ** round));
      }

      const command = new BatchGetCommand({
        RequestItems: { [TableName]: { Keys: keys } },
      });
      const { Responses, UnprocessedKeys } = await dynamoClient.send(command);

      for (const item of (Responses?.[TableName] ??
        []) as CourseItem.ItemType[]) {
        courses.set(item.id, CourseItem.toEntity(item));
      }

      keys = UnprocessedKeys?.[TableName]?.Keys ?? [];
    }

    if (keys.length > 0) {
      throw new Error(`BatchGet left ${String(keys.length)} courses unread.`);
    }

    return courses;
  }
}
