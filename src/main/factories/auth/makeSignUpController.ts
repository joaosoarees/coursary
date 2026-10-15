import { SignUpController } from '@application/controllers/auth/SignUpController';
import { makeSignUpUseCase } from '@main/factories/auth/makeSignUpUseCase';

export function makeSignUpController(): SignUpController {
  return new SignUpController(makeSignUpUseCase());
}
