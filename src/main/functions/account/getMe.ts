import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeGetMeController } from '@main/factories/account/makeGetMeController';

export const handler = lambdaHttpAdapter(makeGetMeController());
