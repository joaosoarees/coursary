import type { Page } from '@application/contracts/Page';
import type { Account } from '@application/entities/Account';
import type { CourseSummary } from '@application/queries/CourseSummary';
import type { ListCoursesByInstructorQuery } from '@application/queries/ListCoursesByInstructorQuery';

export class ListMyCoursesUseCase {
  constructor(
    private readonly listCoursesByInstructor: ListCoursesByInstructorQuery,
  ) {}

  execute({
    callerId,
    limit,
    cursor,
  }: ListMyCoursesUseCase.Input): Promise<Page<CourseSummary>> {
    return this.listCoursesByInstructor.execute({
      instructorId: callerId,
      page: { limit, cursor },
    });
  }
}

export namespace ListMyCoursesUseCase {
  export interface Input extends Page.Options {
    callerId: Account.Id;
  }
}
