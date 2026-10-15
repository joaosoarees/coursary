import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeResetPasswordController } from '@main/factories/auth/makeResetPasswordController';

const controller = makeResetPasswordController();

export const handler = lambdaHttpAdapter(controller);
