import { SignInController } from '@application/controllers/auth/SignInController';
import { makeSignInUseCase } from '@main/factories/auth/makeSignInUseCase';

export function makeSignInController(): SignInController {
  const signInUseCase = makeSignInUseCase();

  return new SignInController(signInUseCase);
}
