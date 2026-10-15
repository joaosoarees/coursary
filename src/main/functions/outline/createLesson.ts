import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeResolveCallerUseCase } from '@main/factories/account/makeResolveCallerUseCase';
import { makeCreateLessonController } from '@main/factories/outline/makeCreateLessonController';

const controller = makeCreateLessonController();
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
