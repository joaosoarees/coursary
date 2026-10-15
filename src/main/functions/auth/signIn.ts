import '@main/bindings';

import { SignInController } from '@application/controllers/auth/SignInController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(
  Registry.getInstance().resolve(SignInController),
);
