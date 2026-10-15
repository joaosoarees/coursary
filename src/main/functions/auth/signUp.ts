import '@main/bindings';

import { SignUpController } from '@application/controllers/auth/SignUpController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(
  Registry.getInstance().resolve(SignUpController),
);
