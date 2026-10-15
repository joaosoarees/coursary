import { SignInUseCase } from '@application/usecases/auth/SignInUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

export function makeSignInUseCase(): SignInUseCase {
  const authGateway = makeAuthGateway();
  const accountsRepository = makeAccountRepository();

  return new SignInUseCase(authGateway, accountsRepository);
}
