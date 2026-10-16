import type { Account } from '@application/entities/account/Account';
import { Course, courseStatuses } from '@application/entities/course/Course';

export class CourseItem {
  static readonly type = 'Course';

  private readonly keys: CourseItem.Keys;

  constructor(private readonly attributes: CourseItem.Attributes) {
    const published =
      attributes.status === courseStatuses.Published && attributes.publishedAt;
    this.keys = {
      PK: CourseItem.getPK(attributes.id),
      SK: CourseItem.getSK(attributes.id),
      GSI1PK: CourseItem.getGSI1PK(attributes.instructorId),
      GSI1SK: CourseItem.getGSI1SK(attributes.id),
      // Only a published course is in the catalog (a sparse index, Q10).
      ...(published
        ? {
            GSI2PK: CourseItem.getGSI2PK(),
            GSI2SK: CourseItem.getGSI2SK(published, attributes.id),
          }
        : {}),
    };
  }

  toItem(): CourseItem.ItemType {
    return { ...this.keys, ...this.attributes, type: CourseItem.type };
  }

  static fromEntity(course: Course): CourseItem {
    return new CourseItem({
      id: course.id,
      instructorId: course.instructorId,
      instructorName: course.instructorName,
      title: course.title,
      description: course.description,
      status: course.status,
      lessonCount: course.lessonCount,
      enrollmentCount: course.enrollmentCount,
      ...(course.publishedAt
        ? { publishedAt: course.publishedAt.toISOString() }
        : {}),
      createdAt: course.createdAt.toISOString(),
    });
  }

  static toEntity(item: CourseItem.ItemType): Course {
    return new Course({
      id: item.id,
      instructorId: item.instructorId,
      instructorName: item.instructorName,
      title: item.title,
      description: item.description,
      status: item.status,
      lessonCount: item.lessonCount,
      enrollmentCount: item.enrollmentCount,
      publishedAt: item.publishedAt ? new Date(item.publishedAt) : undefined,
      createdAt: new Date(item.createdAt),
    });
  }

  static getPK(id: Course.Id): CourseItem.Keys['PK'] {
    return `COURSE#${id}`;
  }

  static getSK(id: Course.Id): CourseItem.Keys['SK'] {
    return `COURSE#${id}`;
  }

  static getGSI1PK(instructorId: Account.Id): CourseItem.Keys['GSI1PK'] {
    return `INSTRUCTOR#${instructorId}`;
  }

  static getGSI1SK(id: Course.Id): CourseItem.Keys['GSI1SK'] {
    return `COURSE#${id}`;
  }

  static getGSI2PK(): 'CATALOG' {
    return 'CATALOG';
  }

  static getGSI2SK(publishedAt: string, id: Course.Id): `${string}#${string}` {
    return `${publishedAt}#${id}`;
  }
}

export namespace CourseItem {
  export interface Keys {
    PK: `COURSE#${string}`;
    SK: `COURSE#${string}`;
    GSI1PK: `INSTRUCTOR#${string}`;
    GSI1SK: `COURSE#${string}`;
    GSI2PK?: 'CATALOG';
    GSI2SK?: `${string}#${string}`;
  }

  export interface Attributes {
    id: Course.Id;
    instructorId: Account.Id;
    instructorName: string;
    title: string;
    description: string;
    status: Course.Status;
    lessonCount: number;
    enrollmentCount: number;
    publishedAt?: string;
    createdAt: string;
  }

  export type ItemType = Keys & Attributes & { type: 'Course' };
}
