import { Account } from '@application/entities/Account';
import { Course } from '@application/entities/Course';
import type { CourseRepository } from '@application/repositories/CourseRepository';
import { CourseDetails } from '@application/usecases/course/CourseDetails';

export class CreateCourseUseCase {
  constructor(private readonly coursesRepository: CourseRepository) {}

  async execute({
    instructor,
    title,
    description,
  }: CreateCourseUseCase.Input): Promise<CourseDetails> {
    const activeInstructor = Account.requireActive(instructor);
    const course = Course.create({
      instructor: activeInstructor,
      title,
      description,
    });

    await this.coursesRepository.create(course);

    return CourseDetails.fromCourse(course);
  }
}

export namespace CreateCourseUseCase {
  export interface Input {
    instructor: Account;
    title: string;
    description: string;
  }
}
