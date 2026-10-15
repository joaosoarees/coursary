import { DeleteModuleController } from '@application/controllers/outline/DeleteModuleController';
import { DeleteModuleUseCase } from '@application/usecases/outline/DeleteModuleUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeCourseOutlineQuery } from '@main/factories/makeCourseOutlineQuery';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeModuleRepository } from '@main/factories/makeModuleRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

const courseRepository = makeCourseRepository();
const moduleRepository = makeModuleRepository();
const courseOutlineQuery = makeCourseOutlineQuery();
const useCase = new DeleteModuleUseCase(
  courseRepository,
  moduleRepository,
  courseOutlineQuery,
  makeUnitOfWork,
);
const controller = new DeleteModuleController(useCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
