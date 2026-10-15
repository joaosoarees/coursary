import { CreateModuleController } from '@application/controllers/outline/CreateModuleController';
import { CreateModuleUseCase } from '@application/usecases/outline/CreateModuleUseCase';
import { makeCourseOutlineQuery } from '@main/factories/makeCourseOutlineQuery';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeModuleRepository } from '@main/factories/makeModuleRepository';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

export function makeCreateModuleController(): CreateModuleController {
  const courseRepository = makeCourseRepository();
  const moduleRepository = makeModuleRepository();
  const courseOutlineQuery = makeCourseOutlineQuery();
  const useCase = new CreateModuleUseCase(
    courseRepository,
    moduleRepository,
    courseOutlineQuery,
    makeUnitOfWork,
  );

  return new CreateModuleController(useCase);
}
