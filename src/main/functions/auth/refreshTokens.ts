import '@main/bindings';

import { RefreshTokensController } from '@application/controllers/auth/RefreshTokensController';
import { Registry } from '@kernel/di/Registry';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(
  Registry.getInstance().resolve(RefreshTokensController),
);
