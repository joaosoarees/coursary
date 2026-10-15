import { Course } from '@application/entities/Course';
import type { CourseOutlineQuery } from '@application/queries/CourseOutlineQuery';
import type { CourseRepository } from '@application/repositories/CourseRepository';
import type { CourseEditor } from '@application/usecases/outline/CourseEditor';

export class GetCourseOutlineUseCase {
  constructor(
    private readonly coursesRepository: CourseRepository,
    private readonly courseOutline: CourseOutlineQuery,
  ) {}

  async execute({
    callerId,
    callerRole,
    courseId,
  }: GetCourseOutlineUseCase.Input): Promise<CourseOutlineQuery.Outline> {
    const found = await this.coursesRepository.findById(courseId);
    const course = Course.requireFound(found);
    course.requireEditableBy(callerId, callerRole);

    return this.courseOutline.execute(courseId);
  }
}

export namespace GetCourseOutlineUseCase {
  export interface Input extends CourseEditor {
    courseId: Course.Id;
  }
}
