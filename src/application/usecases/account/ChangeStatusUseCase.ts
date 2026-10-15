import { type Account, accountStatuses } from '@application/entities/Account';
import { AccountNotActive } from '@application/errors/AccountNotActive';
import { AccountNotFound } from '@application/errors/AccountNotFound';
import { CannotChangeOwnStatus } from '@application/errors/CannotChangeOwnStatus';
import type { AuthGateway } from '@application/gateways/AuthGateway';
import type { AccountRepository } from '@application/repositories/AccountRepository';

export class ChangeStatusUseCase {
  constructor(
    private readonly accountsRepository: AccountRepository,
    private readonly authGateway: AuthGateway,
  ) {}

  async execute({
    callerId,
    accountId,
    status,
  }: ChangeStatusUseCase.Input): Promise<ChangeStatusUseCase.Output> {
    if (callerId === accountId) {
      throw new CannotChangeOwnStatus();
    }

    const account = await this.accountsRepository.findById(accountId);

    if (!account) {
      throw new AccountNotFound();
    }

    if (account.status === accountStatuses.Pending) {
      throw new AccountNotActive();
    }

    if (account.status !== status) {
      const statusChange = {
        accountId,
        fromStatus: account.status,
        toStatus: status,
      };

      await this.accountsRepository.changeStatus(statusChange, callerId);
      console.info(
        JSON.stringify({
          event: 'AccountStatusChanged',
          changedBy: callerId,
          ...statusChange,
        }),
      );
    }

    await this.syncAuthUser(account, status);

    return { id: account.id, status };
  }

  private async syncAuthUser(
    account: Account,
    status: ChangeStatusUseCase.Status,
  ): Promise<void> {
    try {
      if (status === accountStatuses.Disabled) {
        await this.authGateway.disableUser(account.email);
      } else {
        await this.authGateway.enableUser(account.email);
      }
    } catch (error) {
      console.error(
        JSON.stringify({
          event: 'CognitoStatusNotSynced',
          accountId: account.id,
          status,
          error: error instanceof Error ? error.message : String(error),
        }),
      );

      throw error;
    }
  }
}

export namespace ChangeStatusUseCase {
  export type Status =
    typeof accountStatuses.Active | typeof accountStatuses.Disabled;

  export interface Input {
    callerId: string;
    accountId: string;
    status: Status;
  }

  export interface Output {
    id: string;
    status: Status;
  }
}
