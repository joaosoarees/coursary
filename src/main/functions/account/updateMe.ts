import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeUpdateMeController } from '@main/factories/account/makeUpdateMeController';

const controller = makeUpdateMeController();

export const handler = lambdaHttpAdapter(controller);
