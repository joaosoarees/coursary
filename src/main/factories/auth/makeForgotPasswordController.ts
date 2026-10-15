import { ForgotPasswordController } from '@application/controllers/auth/ForgotPasswordController';
import { makeForgotPasswordUseCase } from '@main/factories/auth/makeForgotPasswordUseCase';

export function makeForgotPasswordController(): ForgotPasswordController {
  return new ForgotPasswordController(makeForgotPasswordUseCase());
}
