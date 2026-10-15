import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeSignUpController } from '@main/factories/auth/makeSignUpController';

export const handler = lambdaHttpAdapter(makeSignUpController());
