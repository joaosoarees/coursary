import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeRefreshTokensController } from '@main/factories/auth/makeRefreshTokensController';

const controller = makeRefreshTokensController();

export const handler = lambdaHttpAdapter(controller);
