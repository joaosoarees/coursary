import { Account } from '@application/entities/Account';
import type { AuthGateway } from '@application/gateways/AuthGateway';
import type { AccountRepository } from '@application/repositories/AccountRepository';

export class ResetPasswordUseCase {
  constructor(
    private readonly authGateway: AuthGateway,
    private readonly accountsRepository: AccountRepository,
  ) {}

  async execute(params: AuthGateway.ResetPasswordParams): Promise<void> {
    const email = Account.normalizeEmail(params.email);

    await this.authGateway.resetPassword({ ...params, email });

    try {
      const account = await this.accountsRepository.findByEmail(email);

      if (account) {
        await this.accountsRepository.clearSession(account.id);
      }
    } catch (error) {
      console.error(
        JSON.stringify({
          event: 'SessionsNotRevoked',
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
}
