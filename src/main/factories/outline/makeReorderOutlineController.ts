import { ReorderOutlineController } from '@application/controllers/outline/ReorderOutlineController';
import { ReorderOutlineUseCase } from '@application/usecases/outline/ReorderOutlineUseCase';
import { makeCourseOutlineQuery } from '@main/factories/makeCourseOutlineQuery';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeLessonRepository } from '@main/factories/makeLessonRepository';
import { makeModuleRepository } from '@main/factories/makeModuleRepository';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

export function makeReorderOutlineController(): ReorderOutlineController {
  const courseRepository = makeCourseRepository();
  const moduleRepository = makeModuleRepository();
  const lessonRepository = makeLessonRepository();
  const courseOutlineQuery = makeCourseOutlineQuery();
  const useCase = new ReorderOutlineUseCase(
    courseRepository,
    moduleRepository,
    lessonRepository,
    courseOutlineQuery,
    makeUnitOfWork,
  );

  return new ReorderOutlineController(useCase);
}
