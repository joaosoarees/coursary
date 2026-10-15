import { type Course, courseStatuses } from '@application/entities/Course';
import { CourseArchived } from '@application/errors/CourseArchived';
import { CourseNotFound } from '@application/errors/CourseNotFound';
import type { CourseRepository } from '@application/repositories/CourseRepository';

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
}
