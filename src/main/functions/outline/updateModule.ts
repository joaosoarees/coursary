import { UpdateModuleController } from '@application/controllers/outline/UpdateModuleController';
import { UpdateModuleUseCase } from '@application/usecases/outline/UpdateModuleUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeModuleRepository } from '@main/factories/makeModuleRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

const courseRepository = makeCourseRepository();
const moduleRepository = makeModuleRepository();
const useCase = new UpdateModuleUseCase(
  courseRepository,
  moduleRepository,
  makeUnitOfWork,
);
const controller = new UpdateModuleController(useCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
