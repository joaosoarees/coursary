import { Account } from '@application/entities/Account';
import { Course } from '@application/entities/Course';
import type { AccountRepository } from '@application/repositories/AccountRepository';
import type { CourseRepository } from '@application/repositories/CourseRepository';
import { CourseDetails } from '@application/usecases/course/CourseDetails';

export class CreateCourseUseCase {
  constructor(
    private readonly accountsRepository: AccountRepository,
    private readonly coursesRepository: CourseRepository,
  ) {}

  async execute({
    callerId,
    title,
    description,
  }: CreateCourseUseCase.Input): Promise<CourseDetails> {
    const found = await this.accountsRepository.findById(callerId, {
      consistent: false,
    });
    const instructor = Account.requireActive(found);
    const course = Course.create({ instructor, title, description });

    await this.coursesRepository.create(course);

    return CourseDetails.fromCourse(course);
  }
}

export namespace CreateCourseUseCase {
  export interface Input {
    callerId: Account.Id;
    title: string;
    description: string;
  }
}
