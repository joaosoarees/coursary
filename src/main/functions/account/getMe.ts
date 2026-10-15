import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeGetMeController } from '@main/factories/account/makeGetMeController';

const controller = makeGetMeController();

export const handler = lambdaHttpAdapter(controller);
