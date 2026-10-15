import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeRefreshTokensController } from '@main/factories/auth/makeRefreshTokensController';

export const handler = lambdaHttpAdapter(makeRefreshTokensController());
