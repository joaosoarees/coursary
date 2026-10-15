import { CreateCourseController } from '@application/controllers/course/CreateCourseController';
import { CreateCourseUseCase } from '@application/usecases/course/CreateCourseUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';

const accountsRepository = makeAccountRepository();
const coursesRepository = makeCourseRepository();
const createCourseUseCase = new CreateCourseUseCase(
  accountsRepository,
  coursesRepository,
);
const controller = new CreateCourseController(createCourseUseCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
