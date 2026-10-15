import { ForgotPasswordUseCase } from '@application/usecases/auth/ForgotPasswordUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

export function makeForgotPasswordUseCase(): ForgotPasswordUseCase {
  const accountsRepository = makeAccountRepository();
  const authGateway = makeAuthGateway();

  return new ForgotPasswordUseCase(accountsRepository, authGateway);
}
