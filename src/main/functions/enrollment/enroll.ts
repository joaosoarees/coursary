import { EnrollController } from '@application/controllers/enrollment/EnrollController';
import { EnrollUseCase } from '@application/usecases/enrollment/EnrollUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeEnrollmentRepository } from '@main/factories/makeEnrollmentRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

const courseRepository = makeCourseRepository();
const enrollmentRepository = makeEnrollmentRepository();
const useCase = new EnrollUseCase(
  courseRepository,
  enrollmentRepository,
  makeUnitOfWork,
);
const controller = new EnrollController(useCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
