import '@main/bindings';

import { ResendConfirmationCodeController } from '@application/controllers/auth/ResendConfirmationCodeController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(
  Registry.getInstance().resolve(ResendConfirmationCodeController),
);
