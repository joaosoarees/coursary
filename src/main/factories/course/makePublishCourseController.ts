import { PublishCourseController } from '@application/controllers/course/PublishCourseController';
import { PublishCourseUseCase } from '@application/usecases/course/PublishCourseUseCase';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';

export function makePublishCourseController(): PublishCourseController {
  const coursesRepository = makeCourseRepository();
  const useCase = new PublishCourseUseCase(coursesRepository);

  return new PublishCourseController(useCase);
}
