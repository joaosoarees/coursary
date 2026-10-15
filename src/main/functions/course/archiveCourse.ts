import { ArchiveCourseController } from '@application/controllers/course/ArchiveCourseController';
import { ArchiveCourseUseCase } from '@application/usecases/course/ArchiveCourseUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';

const coursesRepository = makeCourseRepository();
const useCase = new ArchiveCourseUseCase(coursesRepository);
const controller = new ArchiveCourseController(useCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
