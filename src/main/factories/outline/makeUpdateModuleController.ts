import { UpdateModuleController } from '@application/controllers/outline/UpdateModuleController';
import { UpdateModuleUseCase } from '@application/usecases/outline/UpdateModuleUseCase';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeModuleRepository } from '@main/factories/makeModuleRepository';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

export function makeUpdateModuleController(): UpdateModuleController {
  const courseRepository = makeCourseRepository();
  const moduleRepository = makeModuleRepository();
  const useCase = new UpdateModuleUseCase(
    courseRepository,
    moduleRepository,
    makeUnitOfWork,
  );

  return new UpdateModuleController(useCase);
}
