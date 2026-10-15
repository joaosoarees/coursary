import { ConfirmSignUpController } from '@application/controllers/auth/ConfirmSignUpController';
import { makeConfirmSignUpUseCase } from '@main/factories/auth/makeConfirmSignUpUseCase';

export function makeConfirmSignUpController(): ConfirmSignUpController {
  const confirmSignUpUseCase = makeConfirmSignUpUseCase();

  return new ConfirmSignUpController(confirmSignUpUseCase);
}
