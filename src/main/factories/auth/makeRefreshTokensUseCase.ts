import { RefreshTokensUseCase } from '@application/usecases/auth/RefreshTokensUseCase';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

export function makeRefreshTokensUseCase(): RefreshTokensUseCase {
  const authGateway = makeAuthGateway();

  return new RefreshTokensUseCase(authGateway);
}
