import { SignInUseCase } from '@application/usecases/auth/SignInUseCase';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

export function makeSignInUseCase(): SignInUseCase {
  const authGateway = makeAuthGateway();

  return new SignInUseCase(authGateway);
}
