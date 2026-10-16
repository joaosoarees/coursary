import KSUID from 'ksuid';

import type { Account } from '@application/entities/account/Account';
import { KSUID_PATTERN } from '@application/entities/shared/ksuid';
import { Forbidden } from '@application/errors/common';
import {
  CourseArchived,
  CourseNotFound,
  CoursePublished,
} from '@application/errors/course';
import { Permissions, permissions } from '@application/security/permissions';

export const courseStatuses = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
  Archived: 'ARCHIVED',
} as const;

export class Course {
  readonly id: Course.Id;
  readonly instructorId: Account.Id;
  instructorName: string;
  title: string;
  description: string;
  status: Course.Status;
  lessonCount: number;
  enrollmentCount: number;
  publishedAt: Date | undefined;
  readonly createdAt: Date;

  constructor(attributes: Course.Attributes) {
    this.id = attributes.id;
    this.instructorId = attributes.instructorId;
    this.instructorName = attributes.instructorName;
    this.title = attributes.title;
    this.description = attributes.description;
    this.status = attributes.status;
    this.lessonCount = attributes.lessonCount;
    this.enrollmentCount = attributes.enrollmentCount;
    this.publishedAt = attributes.publishedAt;
    this.createdAt = attributes.createdAt;
  }

  isOwnedBy(accountId: Account.Id): boolean {
    return this.instructorId === accountId;
  }

  isVisibleToEveryone(): boolean {
    return this.status !== courseStatuses.Draft;
  }

  // The owner or an admin may change a course; anyone else learns only what
  // they could see (Q95), and an archived course takes no change (Q206).
  requireEditableBy(callerId: Account.Id, callerRole: Account.Role): void {
    const mayEdit =
      this.isOwnedBy(callerId) ||
      Permissions.allows(callerRole, permissions.CoursesUpdateAny);

    if (!mayEdit) {
      throw this.isVisibleToEveryone() ? new Forbidden() : new CourseNotFound();
    }

    if (this.status === courseStatuses.Archived) {
      throw new CourseArchived();
    }
  }

  // Only a draft loses modules and lessons (Q24, Q223).
  requireDraft(): void {
    if (this.status !== courseStatuses.Draft) {
      throw new CoursePublished();
    }
  }

  static requireFound(course: Course | null): Course {
    if (!course) {
      throw new CourseNotFound();
    }

    return course;
  }

  static isId(value: unknown): value is Course.Id {
    return typeof value === 'string' && KSUID_PATTERN.test(value);
  }

  static toId(value: string): Course.Id {
    if (!Course.isId(value)) {
      throw new TypeError(`Not a course id: ${JSON.stringify(value)}`);
    }

    return value;
  }

  static create({
    instructor,
    title,
    description,
  }: {
    instructor: Account;
    title: string;
    description: string;
  }): Course {
    return new Course({
      id: Course.toId(KSUID.randomSync().string),
      instructorId: instructor.id,
      instructorName: instructor.name,
      title: title.trim(),
      description,
      status: courseStatuses.Draft,
      lessonCount: 0,
      enrollmentCount: 0,
      publishedAt: undefined,
      createdAt: new Date(),
    });
  }
}

export namespace Course {
  export type Id = string & { readonly __brand: 'Course.Id' };

  export type Status = (typeof courseStatuses)[keyof typeof courseStatuses];

  export interface Attributes {
    id: Id;
    instructorId: Account.Id;
    instructorName: string;
    title: string;
    description: string;
    status: Status;
    lessonCount: number;
    enrollmentCount: number;
    publishedAt: Date | undefined;
    createdAt: Date;
  }

  export interface Changes {
    title?: string;
    description?: string;
  }
}
