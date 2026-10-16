import { Account } from '@application/entities/account/Account';
import type { AuthGateway } from '@application/gateways/auth/AuthGateway';
import type { AccountRepository } from '@application/repositories/account/AccountRepository';

export class SignInUseCase {
  constructor(
    private readonly authGateway: AuthGateway,
    private readonly accountsRepository: AccountRepository,
  ) {}

  async execute({
    email,
    password,
  }: AuthGateway.SignInParams): Promise<AuthGateway.Tokens> {
    const { tokens, accountId, accessJti } = await this.authGateway.signIn({
      email: Account.normalizeEmail(email),
      password,
    });
    const session = {
      accessJti,
      refreshTokenHash: Account.hashRefreshToken(tokens.refreshToken),
    };

    await this.accountsRepository.saveSession(accountId, session);

    return tokens;
  }
}
