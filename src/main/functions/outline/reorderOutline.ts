import { ReorderOutlineController } from '@application/controllers/outline/ReorderOutlineController';
import { ReorderOutlineUseCase } from '@application/usecases/outline/ReorderOutlineUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeCourseOutlineQuery } from '@main/factories/makeCourseOutlineQuery';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeLessonRepository } from '@main/factories/makeLessonRepository';
import { makeModuleRepository } from '@main/factories/makeModuleRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

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
const controller = new ReorderOutlineController(useCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
