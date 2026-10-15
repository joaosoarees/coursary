import type { Account } from '@application/entities/Account';
import type { Course } from '@application/entities/Course';
import { CourseNotFound } from '@application/errors/CourseNotFound';
import type { CourseRepository } from '@application/repositories/CourseRepository';
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

    course.requireEditableBy(callerId, callerRole);

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
