import { ResendConfirmationCodeController } from '@application/controllers/auth/ResendConfirmationCodeController';
import { makeResendConfirmationCodeUseCase } from '@main/factories/auth/makeResendConfirmationCodeUseCase';

export function makeResendConfirmationCodeController(): ResendConfirmationCodeController {
  return new ResendConfirmationCodeController(
    makeResendConfirmationCodeUseCase(),
  );
}
