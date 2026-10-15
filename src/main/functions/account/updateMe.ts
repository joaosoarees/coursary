import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeResolveCallerUseCase } from '@main/factories/account/makeResolveCallerUseCase';
import { makeUpdateMeController } from '@main/factories/account/makeUpdateMeController';

const controller = makeUpdateMeController();

const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
