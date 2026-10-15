import { DeleteModuleController } from '@application/controllers/outline/DeleteModuleController';
import { DeleteModuleUseCase } from '@application/usecases/outline/DeleteModuleUseCase';
import { makeCourseOutlineQuery } from '@main/factories/makeCourseOutlineQuery';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeModuleRepository } from '@main/factories/makeModuleRepository';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

export function makeDeleteModuleController(): DeleteModuleController {
  const courseRepository = makeCourseRepository();
  const moduleRepository = makeModuleRepository();
  const courseOutlineQuery = makeCourseOutlineQuery();
  const useCase = new DeleteModuleUseCase(
    courseRepository,
    moduleRepository,
    courseOutlineQuery,
    makeUnitOfWork,
  );

  return new DeleteModuleController(useCase);
}
