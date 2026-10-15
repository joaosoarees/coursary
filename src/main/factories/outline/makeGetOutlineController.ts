import { GetOutlineController } from '@application/controllers/outline/GetOutlineController';
import { GetCourseOutlineUseCase } from '@application/usecases/outline/GetCourseOutlineUseCase';
import { makeCourseOutlineQuery } from '@main/factories/makeCourseOutlineQuery';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';

export function makeGetOutlineController(): GetOutlineController {
  const courseRepository = makeCourseRepository();
  const courseOutlineQuery = makeCourseOutlineQuery();
  const useCase = new GetCourseOutlineUseCase(
    courseRepository,
    courseOutlineQuery,
  );

  return new GetOutlineController(useCase);
}
