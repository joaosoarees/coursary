import { ResendConfirmationCodeUseCase } from '@application/usecases/auth/ResendConfirmationCodeUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

export function makeResendConfirmationCodeUseCase(): ResendConfirmationCodeUseCase {
  const accountsRepository = makeAccountRepository();
  const authGateway = makeAuthGateway();

  return new ResendConfirmationCodeUseCase(accountsRepository, authGateway);
}
