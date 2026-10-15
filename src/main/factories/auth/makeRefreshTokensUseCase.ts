import { RefreshTokensUseCase } from '@application/usecases/auth/RefreshTokensUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

export function makeRefreshTokensUseCase(): RefreshTokensUseCase {
  const authGateway = makeAuthGateway();
  const accountsRepository = makeAccountRepository();

  return new RefreshTokensUseCase(authGateway, accountsRepository);
}
