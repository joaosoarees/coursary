import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeResolveCallerUseCase } from '@main/factories/account/makeResolveCallerUseCase';
import { makeCreateModuleController } from '@main/factories/outline/makeCreateModuleController';

const controller = makeCreateModuleController();
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
