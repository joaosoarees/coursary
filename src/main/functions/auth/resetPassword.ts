import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeResetPasswordController } from '@main/factories/auth/makeResetPasswordController';

export const handler = lambdaHttpAdapter(makeResetPasswordController());
