import { UpdateMeController } from '@application/controllers/account/UpdateMeController';
import { UpdateMeUseCase } from '@application/usecases/account/UpdateMeUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeEnrollmentRepository } from '@main/factories/makeEnrollmentRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';

const accountsRepository = makeAccountRepository();
const coursesRepository = makeCourseRepository();
const enrollmentsRepository = makeEnrollmentRepository();
const updateMeUseCase = new UpdateMeUseCase(
  accountsRepository,
  coursesRepository,
  enrollmentsRepository,
);
const controller = new UpdateMeController(updateMeUseCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
