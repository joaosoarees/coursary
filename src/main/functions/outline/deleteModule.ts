import { DeleteModuleController } from '@application/controllers/outline/DeleteModuleController';
import { DeleteModuleUseCase } from '@application/usecases/outline/DeleteModuleUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeCourseOutlineQuery } from '@main/factories/makeCourseOutlineQuery';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeModuleRepository } from '@main/factories/makeModuleRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

const coursesRepository = makeCourseRepository();
const modulesRepository = makeModuleRepository();
const courseOutlineQuery = makeCourseOutlineQuery();
const deleteModuleUseCase = new DeleteModuleUseCase(
  coursesRepository,
  modulesRepository,
  courseOutlineQuery,
  makeUnitOfWork,
);
const controller = new DeleteModuleController(deleteModuleUseCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
