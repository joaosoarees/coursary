import type { Account } from '@application/entities/Account';
import { type Course, courseStatuses } from '@application/entities/Course';
import { CourseArchived } from '@application/errors/CourseArchived';
import { CourseNotFound } from '@application/errors/CourseNotFound';
import { Forbidden } from '@application/errors/Forbidden';
import type { CourseRepository } from '@application/repositories/CourseRepository';
import { Permissions, permissions } from '@application/security/permissions';
import { CourseDetails } from '@application/usecases/course/CourseDetails';

export class UpdateCourseUseCase {
  constructor(private readonly coursesRepository: CourseRepository) {}

  async execute({
    callerId,
    callerRole,
    courseId,
    changes,
  }: UpdateCourseUseCase.Input): Promise<CourseDetails> {
    const course = await this.coursesRepository.findById(courseId);

    if (!course) {
      throw new CourseNotFound();
    }

    const mayEdit =
      course.isOwnedBy(callerId) ||
      Permissions.allows(callerRole, permissions.CoursesUpdateAny);

    if (!mayEdit) {
      throw course.isVisibleToEveryone()
        ? new Forbidden()
        : new CourseNotFound();
    }

    if (course.status === courseStatuses.Archived) {
      throw new CourseArchived();
    }

    const updated = await this.coursesRepository.update(courseId, changes);

    return CourseDetails.fromCourse(updated);
  }
}

export namespace UpdateCourseUseCase {
  export interface Input {
    callerId: Account.Id;
    callerRole: Account.Role;
    courseId: Course.Id;
    changes: Course.Changes;
  }
}
