import { GetCourseOutlineController } from '@application/controllers/outline/GetCourseOutlineController';
import { GetCourseOutlineUseCase } from '@application/usecases/outline/GetCourseOutlineUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeCourseOutlineQuery } from '@main/factories/makeCourseOutlineQuery';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';

const coursesRepository = makeCourseRepository();
const courseOutlineQuery = makeCourseOutlineQuery();
const getCourseOutlineUseCase = new GetCourseOutlineUseCase(
  coursesRepository,
  courseOutlineQuery,
);
const controller = new GetCourseOutlineController(getCourseOutlineUseCase);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
