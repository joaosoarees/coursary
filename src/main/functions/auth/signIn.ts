import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeSignInController } from '@main/factories/auth/makeSignInController';

export const handler = lambdaHttpAdapter(makeSignInController());
