import { GetOutlineController } from '@application/controllers/outline/GetOutlineController';
import { GetCourseOutlineUseCase } from '@application/usecases/outline/GetCourseOutlineUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeCourseOutlineQuery } from '@main/factories/makeCourseOutlineQuery';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';

const courseRepository = makeCourseRepository();
const courseOutlineQuery = makeCourseOutlineQuery();
const useCase = new GetCourseOutlineUseCase(
  courseRepository,
  courseOutlineQuery,
);
const controller = new GetOutlineController(useCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
