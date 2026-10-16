import { InMemoryUnitOfWork } from '@tests/fakes/InMemoryUnitOfWork';

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

export class InMemoryCourseRepository implements CourseRepository {
  readonly courses = new Map<Course.Id, Course>();

  create(course: Course): Promise<void> {
    this.courses.set(course.id, course);

    return Promise.resolve();
  }

  findById(id: Course.Id): Promise<Course | null> {
    return Promise.resolve(this.courses.get(id) ?? null);
  }

  update(id: Course.Id, changes: Course.Changes): Promise<Course> {
    const course = this.courses.get(id);

    if (!course) {
      return Promise.reject(new CourseNotFound());
    }

    if (course.status === courseStatuses.Archived) {
      return Promise.reject(new CourseArchived());
    }

    course.title = changes.title ?? course.title;
    course.description = changes.description ?? course.description;

    return Promise.resolve(course);
  }

  updateInstructorName(instructorId: Account.Id, name: string): Promise<void> {
    for (const course of this.courses.values()) {
      if (course.isOwnedBy(instructorId)) {
        course.instructorName = name;
      }
    }

    return Promise.resolve();
  }

  statusUnchangedOperation(course: Course): UnitOfWork.Operation {
    const status = course.status;

    return InMemoryUnitOfWork.operation({
      check: () =>
        this.courses.get(course.id)?.status === status
          ? undefined
          : new Conflict(),
      apply: () => undefined,
    });
  }

  addLessonsOperation(course: Course, delta: number): UnitOfWork.Operation {
    const status = course.status;

    return InMemoryUnitOfWork.operation({
      check: () =>
        this.courses.get(course.id)?.status === status
          ? undefined
          : new Conflict(),
      apply: () => {
        const stored = this.courses.get(course.id);

        if (stored) {
          stored.lessonCount += delta;
        }
      },
    });
  }

  publish(id: Course.Id, publishedAt: Date): Promise<Course> {
    const course = this.courses.get(id);

    if (!course) {
      return Promise.reject(new CourseNotFound());
    }

    if (course.status !== courseStatuses.Draft) {
      return Promise.reject(
        course.status === courseStatuses.Archived
          ? new CourseArchived()
          : new Conflict(),
      );
    }

    if (course.lessonCount === 0) {
      return Promise.reject(new CourseEmpty());
    }

    course.status = courseStatuses.Published;
    course.publishedAt = publishedAt;

    return Promise.resolve(course);
  }

  archive(id: Course.Id): Promise<Course> {
    const course = this.courses.get(id);

    if (!course) {
      return Promise.reject(new CourseNotFound());
    }

    if (course.status !== courseStatuses.Published) {
      return Promise.reject(
        course.status === courseStatuses.Draft
          ? new CourseNotPublished()
          : new CourseArchived(),
      );
    }

    course.status = courseStatuses.Archived;

    return Promise.resolve(course);
  }
}
