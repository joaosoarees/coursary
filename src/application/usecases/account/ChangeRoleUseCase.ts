import { type Account, accountStatuses } from '@application/entities/Account';
import { RoleChange } from '@application/entities/RoleChange';
import { AccountNotActive } from '@application/errors/AccountNotActive';
import { AccountNotFound } from '@application/errors/AccountNotFound';
import { CannotChangeOwnRole } from '@application/errors/CannotChangeOwnRole';
import type { AccountRepository } from '@application/repositories/AccountRepository';

export class ChangeRoleUseCase {
  constructor(private readonly accountsRepository: AccountRepository) {}

  async execute({
    callerId,
    accountId,
    role,
  }: ChangeRoleUseCase.Input): Promise<ChangeRoleUseCase.Output> {
    if (callerId === accountId) {
      throw new CannotChangeOwnRole();
    }

    const account = await this.accountsRepository.findById(accountId);

    if (!account) {
      throw new AccountNotFound();
    }

    if (account.status !== accountStatuses.Active) {
      throw new AccountNotActive();
    }

    if (account.role === role) {
      return { id: account.id, role };
    }

    const roleChange = RoleChange.create({
      account,
      toRole: role,
      changedBy: callerId,
    });

    await this.accountsRepository.changeRole(roleChange, {
      adminCallerId: callerId,
    });

    return { id: account.id, role };
  }
}

export namespace ChangeRoleUseCase {
  export interface Input {
    callerId: Account.Id;
    accountId: Account.Id;
    role: Account.Role;
  }

  export interface Output {
    id: string;
    role: Account.Role;
  }
}
