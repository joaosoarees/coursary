import { GetCoursePageController } from '@application/controllers/catalog/GetCoursePageController';
import { GetCoursePageUseCase } from '@application/usecases/catalog/GetCoursePageUseCase';
import { makeCoursePageQuery } from '@main/factories/makeCoursePageQuery';

export function makeGetCoursePageController(): GetCoursePageController {
  const coursePageQuery = makeCoursePageQuery();
  const getCoursePageUseCase = new GetCoursePageUseCase(coursePageQuery);

  return new GetCoursePageController(getCoursePageUseCase);
}
