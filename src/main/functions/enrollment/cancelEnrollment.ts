import { CancelEnrollmentController } from '@application/controllers/enrollment/CancelEnrollmentController';
import { CancelEnrollmentUseCase } from '@application/usecases/enrollment/CancelEnrollmentUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeEnrollmentRepository } from '@main/factories/makeEnrollmentRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';
import { makeUnitOfWork } from '@main/factories/makeUnitOfWork';

const courseRepository = makeCourseRepository();
const enrollmentRepository = makeEnrollmentRepository();
const useCase = new CancelEnrollmentUseCase(
  courseRepository,
  enrollmentRepository,
  makeUnitOfWork,
);
const controller = new CancelEnrollmentController(useCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
