import { Course, courseStatuses } from '@application/entities/course/Course';
import type { CourseRepository } from '@application/repositories/course/CourseRepository';
import { CourseDetails } from '@application/usecases/course/CourseDetails';
import type { CourseEditor } from '@application/usecases/course/CourseEditor';

export class PublishCourseUseCase {
  constructor(private readonly coursesRepository: CourseRepository) {}

  async execute({
    callerId,
    callerRole,
    courseId,
  }: PublishCourseUseCase.Input): Promise<CourseDetails> {
    const found = await this.coursesRepository.findById(courseId);
    const course = Course.requireFound(found);
    course.requireEditableBy(callerId, callerRole);

    if (course.status === courseStatuses.Published) {
      const description =
        await this.coursesRepository.findDescription(courseId);

      return CourseDetails.fromCourse(course, description);
    }

    const [published, description] = await Promise.all([
      this.coursesRepository.publish(courseId, new Date()),
      this.coursesRepository.findDescription(courseId),
    ]);

    return CourseDetails.fromCourse(published, description);
  }
}

export namespace PublishCourseUseCase {
  export interface Input extends CourseEditor {
    courseId: Course.Id;
  }
}
