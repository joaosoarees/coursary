import { CreateCourseController } from '@application/controllers/course/CreateCourseController';
import { CreateCourseUseCase } from '@application/usecases/course/CreateCourseUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';

export function makeCreateCourseController(): CreateCourseController {
  const accountsRepository = makeAccountRepository();
  const coursesRepository = makeCourseRepository();
  const createCourseUseCase = new CreateCourseUseCase(
    accountsRepository,
    coursesRepository,
  );

  return new CreateCourseController(createCourseUseCase);
}
