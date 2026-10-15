import { UpdateCourseController } from '@application/controllers/course/UpdateCourseController';
import { UpdateCourseUseCase } from '@application/usecases/course/UpdateCourseUseCase';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';

export function makeUpdateCourseController(): UpdateCourseController {
  const coursesRepository = makeCourseRepository();
  const updateCourseUseCase = new UpdateCourseUseCase(coursesRepository);

  return new UpdateCourseController(updateCourseUseCase);
}
