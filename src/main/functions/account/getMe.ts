import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeGetMeController } from '@main/factories/account/makeGetMeController';
import { makeResolveCallerUseCase } from '@main/factories/account/makeResolveCallerUseCase';

const controller = makeGetMeController();

const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
