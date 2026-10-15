import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeForgotPasswordController } from '@main/factories/auth/makeForgotPasswordController';

const controller = makeForgotPasswordController();

export const handler = lambdaHttpAdapter(controller);
