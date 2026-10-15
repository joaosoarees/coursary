import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeGetCoursePageController } from '@main/factories/catalog/makeGetCoursePageController';

const controller = makeGetCoursePageController();

export const handler = lambdaHttpAdapter(controller);
