import {
  type Course,
  courseStatuses,
} from '@application/entities/course/Course';
import type { CoursePageQuery } from '@application/queries/catalog/CoursePageQuery';
import { CourseItem } from '@infra/database/dynamo/items/course/CourseItem';
import { DynamoCourseOutlineQuery } from '@infra/database/dynamo/queries/outline/DynamoCourseOutlineQuery';
import { queryAll } from '@infra/database/dynamo/queryAll';
import type { AppConfig } from '@shared/config/AppConfig';

// The course and its outline share one partition, so one query reads them (pattern 6).
export class DynamoCoursePageQuery implements CoursePageQuery {
  constructor(private readonly config: AppConfig) {}

  async execute(courseId: Course.Id): Promise<CoursePageQuery.Page | null> {
    const items = await queryAll<{ type: string }>({
      TableName: this.config.mainTableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': CourseItem.getPK(courseId) },
    });

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
