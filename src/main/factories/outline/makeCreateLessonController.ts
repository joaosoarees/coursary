import { CreateLessonController } from '@application/controllers/outline/CreateLessonController';
import { CreateLessonUseCase } from '@application/usecases/outline/CreateLessonUseCase';
import { makeCourseOutlineQuery } from '@main/factories/makeCourseOutlineQuery';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeLessonRepository } from '@main/factories/makeLessonRepository';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

export function makeCreateLessonController(): CreateLessonController {
  const courseRepository = makeCourseRepository();
  const lessonRepository = makeLessonRepository();
  const courseOutlineQuery = makeCourseOutlineQuery();
  const useCase = new CreateLessonUseCase(
    courseRepository,
    lessonRepository,
    courseOutlineQuery,
    makeUnitOfWork,
  );

  return new CreateLessonController(useCase);
}
