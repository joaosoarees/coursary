import '@main/bindings';

import { ConfirmSignUpController } from '@application/controllers/auth/ConfirmSignUpController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(
  Registry.getInstance().resolve(ConfirmSignUpController),
);
