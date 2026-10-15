import { ForgotPasswordController } from '@application/controllers/auth/ForgotPasswordController';
import { makeForgotPasswordUseCase } from '@main/factories/auth/makeForgotPasswordUseCase';

export function makeForgotPasswordController(): ForgotPasswordController {
  const forgotPasswordUseCase = makeForgotPasswordUseCase();

  return new ForgotPasswordController(forgotPasswordUseCase);
}
