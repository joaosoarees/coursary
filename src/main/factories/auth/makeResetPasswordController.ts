import { ResetPasswordController } from '@application/controllers/auth/ResetPasswordController';
import { makeResetPasswordUseCase } from '@main/factories/auth/makeResetPasswordUseCase';

export function makeResetPasswordController(): ResetPasswordController {
  return new ResetPasswordController(makeResetPasswordUseCase());
}
