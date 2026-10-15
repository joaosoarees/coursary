import { SignUpUseCase } from '@application/usecases/auth/SignUpUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

export function makeSignUpUseCase(): SignUpUseCase {
  return new SignUpUseCase(makeAccountRepository(), makeAuthGateway());
}
