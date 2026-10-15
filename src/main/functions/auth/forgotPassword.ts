import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeForgotPasswordController } from '@main/factories/auth/makeForgotPasswordController';

export const handler = lambdaHttpAdapter(makeForgotPasswordController());
