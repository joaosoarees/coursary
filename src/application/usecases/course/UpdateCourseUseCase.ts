import type { Account } from '@application/entities/account/Account';
import { Course } from '@application/entities/course/Course';
import type { CourseRepository } from '@application/repositories/course/CourseRepository';
import { CourseDetails } from '@application/usecases/course/CourseDetails';

export class UpdateCourseUseCase {
  constructor(private readonly coursesRepository: CourseRepository) {}

  async execute({
    callerId,
    callerRole,
    courseId,
    changes,
  }: UpdateCourseUseCase.Input): Promise<CourseDetails> {
    const found = await this.coursesRepository.findById(courseId);
    const course = Course.requireFound(found);
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
