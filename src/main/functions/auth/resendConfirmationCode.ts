import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeResendConfirmationCodeController } from '@main/factories/auth/makeResendConfirmationCodeController';

export const handler = lambdaHttpAdapter(
  makeResendConfirmationCodeController(),
);
