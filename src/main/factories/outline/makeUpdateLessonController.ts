import { UpdateLessonController } from '@application/controllers/outline/UpdateLessonController';
import { UpdateLessonUseCase } from '@application/usecases/outline/UpdateLessonUseCase';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeLessonRepository } from '@main/factories/makeLessonRepository';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

export function makeUpdateLessonController(): UpdateLessonController {
  const courseRepository = makeCourseRepository();
  const lessonRepository = makeLessonRepository();
  const useCase = new UpdateLessonUseCase(
    courseRepository,
    lessonRepository,
    makeUnitOfWork,
  );

  return new UpdateLessonController(useCase);
}
