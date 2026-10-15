import { normalizeEmail } from '@application/entities/Account';
import type { AuthGateway } from '@application/gateways/AuthGateway';

export class SignInUseCase {
  constructor(private readonly authGateway: AuthGateway) {}

  execute({
    email,
    password,
  }: AuthGateway.SignInParams): Promise<AuthGateway.Tokens> {
    return this.authGateway.signIn({ email: normalizeEmail(email), password });
  }
}
