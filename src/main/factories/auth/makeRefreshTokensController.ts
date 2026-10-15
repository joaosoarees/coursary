import { RefreshTokensController } from '@application/controllers/auth/RefreshTokensController';
import { makeRefreshTokensUseCase } from '@main/factories/auth/makeRefreshTokensUseCase';

export function makeRefreshTokensController(): RefreshTokensController {
  return new RefreshTokensController(makeRefreshTokensUseCase());
}
