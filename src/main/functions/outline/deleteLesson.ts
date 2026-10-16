import { DeleteLessonController } from '@application/controllers/outline/DeleteLessonController';
import { DeleteLessonUseCase } from '@application/usecases/outline/DeleteLessonUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeLessonRepository } from '@main/factories/makeLessonRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

const courseRepository = makeCourseRepository();
const lessonRepository = makeLessonRepository();
const useCase = new DeleteLessonUseCase(
  courseRepository,
  lessonRepository,
  makeUnitOfWork,
);
const controller = new DeleteLessonController(useCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
