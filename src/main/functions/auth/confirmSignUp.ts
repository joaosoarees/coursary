import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeConfirmSignUpController } from '@main/factories/auth/makeConfirmSignUpController';

export const handler = lambdaHttpAdapter(makeConfirmSignUpController());
