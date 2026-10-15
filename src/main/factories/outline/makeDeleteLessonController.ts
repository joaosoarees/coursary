import { DeleteLessonController } from '@application/controllers/outline/DeleteLessonController';
import { DeleteLessonUseCase } from '@application/usecases/outline/DeleteLessonUseCase';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeLessonRepository } from '@main/factories/makeLessonRepository';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

export function makeDeleteLessonController(): DeleteLessonController {
  const courseRepository = makeCourseRepository();
  const lessonRepository = makeLessonRepository();
  const useCase = new DeleteLessonUseCase(
    courseRepository,
    lessonRepository,
    makeUnitOfWork,
  );

  return new DeleteLessonController(useCase);
}
