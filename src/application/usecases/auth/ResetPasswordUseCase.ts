import { Account } from '@application/entities/Account';
import type { AuthGateway } from '@application/gateways/AuthGateway';

export class ResetPasswordUseCase {
  constructor(private readonly authGateway: AuthGateway) {}

  async execute(params: AuthGateway.ResetPasswordParams): Promise<void> {
    const email = Account.normalizeEmail(params.email);

    await this.authGateway.resetPassword({ ...params, email });

    try {
      await this.authGateway.signOutEverywhere(email);
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
