import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeSignUpController } from '@main/factories/auth/makeSignUpController';

const controller = makeSignUpController();

export const handler = lambdaHttpAdapter(controller);
