import type { Page } from '@application/contracts/Page';
import type { Account } from '@application/entities/Account';
import { AccountNotFound } from '@application/errors/account';
import type { ListRoleChangesQuery } from '@application/queries/ListRoleChangesQuery';
import type { RoleChangeSummary } from '@application/queries/RoleChangeSummary';
import type { AccountRepository } from '@application/repositories/AccountRepository';

export class ListRoleChangesUseCase {
  constructor(
    private readonly accountsRepository: AccountRepository,
    private readonly listRoleChanges: ListRoleChangesQuery,
  ) {}

  async execute({
    accountId,
    limit,
    cursor,
  }: ListRoleChangesUseCase.Input): Promise<Page<RoleChangeSummary>> {
    const account = await this.accountsRepository.findById(accountId, {
      consistent: false,
    });

    if (!account) {
      throw new AccountNotFound();
    }

    return this.listRoleChanges.execute({
      accountId,
      page: { limit, cursor },
    });
  }
}

export namespace ListRoleChangesUseCase {
  export interface Input extends Page.Options {
    accountId: Account.Id;
  }
}
