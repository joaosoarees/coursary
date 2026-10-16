import type { Course } from '@application/entities/course/Course';
import type { CourseOutlineQuery } from '@application/queries/outline/CourseOutlineQuery';
import { CourseItem } from '@infra/database/dynamo/items/course/CourseItem';
import { LessonItem } from '@infra/database/dynamo/items/outline/LessonItem';
import { ModuleItem } from '@infra/database/dynamo/items/outline/ModuleItem';
import { queryAll } from '@infra/database/dynamo/queryAll';
import type { AppConfig } from '@shared/config/AppConfig';

type OutlineItem = ModuleItem.ItemType | LessonItem.ItemType;

export class DynamoCourseOutlineQuery implements CourseOutlineQuery {
  constructor(private readonly config: AppConfig) {}

  async execute(
    courseId: Course.Id,
    { consistent = false }: CourseOutlineQuery.ReadOptions = {},
  ): Promise<CourseOutlineQuery.Outline> {
    const items = await this.readPartition(courseId, consistent);

    return DynamoCourseOutlineQuery.toOutline(items);
  }

  // Groups the items of a course partition into modules and lessons, in order.
  static toOutline(items: { type: string }[]): CourseOutlineQuery.Outline {
    const outlineItems = items.filter(
      (item): item is OutlineItem =>
        item.type === ModuleItem.type || item.type === LessonItem.type,
    );
    const modules = new Map<string, CourseOutlineQuery.Module>();

    for (const item of outlineItems) {
      if (item.type === ModuleItem.type) {
        modules.set(item.id, {
          id: item.id,
          title: item.title,
          position: item.position,
          lessons: [],
        });
      }
    }

    for (const item of outlineItems) {
      if (item.type === LessonItem.type) {
        modules.get(item.moduleId)?.lessons.push({
          id: item.id,
          title: item.title,
          durationMinutes: item.durationMinutes,
          position: item.position,
        });
      }
    }

    const ordered = [...modules.values()].sort((a, b) =>
      DynamoCourseOutlineQuery.byPosition(a, b),
    );

    for (const module of ordered) {
      module.lessons.sort((a, b) => DynamoCourseOutlineQuery.byPosition(a, b));
    }

    return { modules: ordered };
  }

  private async readPartition(
    courseId: Course.Id,
    consistent: boolean,
  ): Promise<OutlineItem[]> {
    const items = await queryAll<OutlineItem>({
      TableName: this.config.mainTableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': CourseItem.getPK(courseId),
        ':prefix': 'MODULE#',
      },
      ConsistentRead: consistent,
    });

    return items;
  }

  // Position decides; the id breaks a tie left by two creations at once (Q225).
  private static byPosition(
    a: { position: number; id: string },
    b: { position: number; id: string },
  ): number {
    return a.position - b.position || a.id.localeCompare(b.id);
  }
}
