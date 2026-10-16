import { CreateLessonController } from '@application/controllers/outline/CreateLessonController';
import { CreateLessonUseCase } from '@application/usecases/outline/CreateLessonUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeCourseOutlineQuery } from '@main/factories/makeCourseOutlineQuery';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeLessonRepository } from '@main/factories/makeLessonRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

const courseRepository = makeCourseRepository();
const lessonRepository = makeLessonRepository();
const courseOutlineQuery = makeCourseOutlineQuery();
const useCase = new CreateLessonUseCase(
  courseRepository,
  lessonRepository,
  courseOutlineQuery,
  makeUnitOfWork,
);
const controller = new CreateLessonController(useCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
