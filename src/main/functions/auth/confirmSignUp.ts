import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeConfirmSignUpController } from '@main/factories/auth/makeConfirmSignUpController';

const controller = makeConfirmSignUpController();

export const handler = lambdaHttpAdapter(controller);
