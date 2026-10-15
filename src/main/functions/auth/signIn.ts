import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeSignInController } from '@main/factories/auth/makeSignInController';

const controller = makeSignInController();

export const handler = lambdaHttpAdapter(controller);
