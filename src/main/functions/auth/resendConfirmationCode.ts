import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeResendConfirmationCodeController } from '@main/factories/auth/makeResendConfirmationCodeController';

const controller = makeResendConfirmationCodeController();

export const handler = lambdaHttpAdapter(controller);
