import { ListMyCoursesController } from '@application/controllers/course/ListMyCoursesController';
import { ListMyCoursesUseCase } from '@application/usecases/course/ListMyCoursesUseCase';
import { makeListCoursesByInstructorQuery } from '@main/factories/makeListCoursesByInstructorQuery';

export function makeListMyCoursesController(): ListMyCoursesController {
  const listCoursesByInstructorQuery = makeListCoursesByInstructorQuery();
  const listMyCoursesUseCase = new ListMyCoursesUseCase(
    listCoursesByInstructorQuery,
  );

  return new ListMyCoursesController(listMyCoursesUseCase);
}
