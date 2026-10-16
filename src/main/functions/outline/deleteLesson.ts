import { DeleteLessonController } from '@application/controllers/outline/DeleteLessonController';
import { DeleteLessonUseCase } from '@application/usecases/outline/DeleteLessonUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeLessonRepository } from '@main/factories/makeLessonRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

const coursesRepository = makeCourseRepository();
const lessonsRepository = makeLessonRepository();
const deleteLessonUseCase = new DeleteLessonUseCase(
  coursesRepository,
  lessonsRepository,
  makeUnitOfWork,
);
const controller = new DeleteLessonController(deleteLessonUseCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
