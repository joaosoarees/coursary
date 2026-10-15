import { ForgotPasswordUseCase } from '@application/usecases/auth/ForgotPasswordUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

export function makeForgotPasswordUseCase(): ForgotPasswordUseCase {
  return new ForgotPasswordUseCase(makeAccountRepository(), makeAuthGateway());
}
