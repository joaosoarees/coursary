import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeResolveCallerUseCase } from '@main/factories/account/makeResolveCallerUseCase';
import { makeUpdateModuleController } from '@main/factories/outline/makeUpdateModuleController';

const controller = makeUpdateModuleController();
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
