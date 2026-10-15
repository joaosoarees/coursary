import { ResetPasswordUseCase } from '@application/usecases/auth/ResetPasswordUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

export function makeResetPasswordUseCase(): ResetPasswordUseCase {
  const authGateway = makeAuthGateway();
  const accountsRepository = makeAccountRepository();

  return new ResetPasswordUseCase(authGateway, accountsRepository);
}
