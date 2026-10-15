import { ResetPasswordUseCase } from '@application/usecases/auth/ResetPasswordUseCase';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

export function makeResetPasswordUseCase(): ResetPasswordUseCase {
  const authGateway = makeAuthGateway();

  return new ResetPasswordUseCase(authGateway);
}
