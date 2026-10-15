import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeUpdateMeController } from '@main/factories/account/makeUpdateMeController';

export const handler = lambdaHttpAdapter(makeUpdateMeController());
