import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeResolveCallerUseCase } from '@main/factories/account/makeResolveCallerUseCase';
import { makeReorderOutlineController } from '@main/factories/outline/makeReorderOutlineController';

const controller = makeReorderOutlineController();
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
