import type { Account } from '@application/entities/Account';
import { AuthUserNotPending } from '@application/errors/AuthUserNotPending';
import { InvalidCode } from '@application/errors/InvalidCode';
import { AuthGateway } from '@application/gateways/AuthGateway';
import { AccountRepository } from '@application/repositories/AccountRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class ConfirmSignUpUseCase {
  constructor(
    private readonly accountsRepository: AccountRepository,
    private readonly authGateway: AuthGateway,
  ) {}

  async execute({ email, code }: ConfirmSignUpUseCase.Input): Promise<void> {
    const account = await this.accountsRepository.findPendingByEmail(email);

    if (!account) {
      throw new InvalidCode();
    }

    await this.confirmInAuth(account, code);

    account.activate();
    await this.accountsRepository.activate(account);
  }

  private async confirmInAuth(account: Account, code: string): Promise<void> {
    try {
      await this.authGateway.confirmSignUp(account.email, code);
    } catch (error) {
      if (!(error instanceof AuthUserNotPending)) {
        throw error;
      }

      if (!(await this.authGateway.isUserConfirmed(account.email))) {
        throw new InvalidCode();
      }

      console.error(
        JSON.stringify({
          event: 'ConfirmedUserWithPendingAccount',
          accountId: account.id,
        }),
      );
    }
  }
}

export namespace ConfirmSignUpUseCase {
  export interface Input {
    email: string;
    code: string;
  }
}
