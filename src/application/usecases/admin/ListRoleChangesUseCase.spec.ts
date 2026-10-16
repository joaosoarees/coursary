import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';
import { anAccountId } from '@tests/support/ids';

import type { Page } from '@application/contracts/Page';
import { Account } from '@application/entities/account/Account';
import { AccountNotFound } from '@application/errors/account';
import type { ListRoleChangesQuery } from '@application/queries/admin/ListRoleChangesQuery';
import type { RoleChangeSummary } from '@application/queries/admin/RoleChangeSummary';
import { ListRoleChangesUseCase } from '@application/usecases/admin/ListRoleChangesUseCase';

const emptyPage = { items: [], nextCursor: null };

let accounts: InMemoryAccountRepository;
let account: Account;

beforeEach(async () => {
  accounts = new InMemoryAccountRepository();
  account = Account.create({ name: 'Ana', email: 'ana@example.com' });
  await accounts.create(account);
});

describe('ListRoleChangesUseCase', () => {
  const page: Page<RoleChangeSummary> = emptyPage;
  const query: ListRoleChangesQuery = {
    execute: () => Promise.resolve(page),
  };

  it('should list the changes of an existing account', async () => {
    await expect(
      new ListRoleChangesUseCase(accounts, query).execute({
        accountId: account.id,
        limit: 20,
        cursor: undefined,
      }),
    ).resolves.toBe(page);
  });

  it('should answer not found for an unknown account', async () => {
    await expect(
      new ListRoleChangesUseCase(accounts, query).execute({
        accountId: anAccountId(),
        limit: 20,
        cursor: undefined,
      }),
    ).rejects.toBeInstanceOf(AccountNotFound);
  });
});
