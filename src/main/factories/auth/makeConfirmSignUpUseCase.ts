import { ConfirmSignUpUseCase } from '@application/usecases/auth/ConfirmSignUpUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

export function makeConfirmSignUpUseCase(): ConfirmSignUpUseCase {
  const accountsRepository = makeAccountRepository();
  const authGateway = makeAuthGateway();

  return new ConfirmSignUpUseCase(accountsRepository, authGateway);
}
