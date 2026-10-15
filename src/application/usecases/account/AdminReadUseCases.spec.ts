import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';

import type { Page } from '@application/contracts/Page';
import { Account, accountRoles } from '@application/entities/Account';
import { AccountNotFound } from '@application/errors/AccountNotFound';
import type { ListAccountsByRoleQuery } from '@application/queries/ListAccountsByRoleQuery';
import type { ListRoleChangesQuery } from '@application/queries/ListRoleChangesQuery';
import type { RoleChangeSummary } from '@application/queries/RoleChangeSummary';
import { FindAccountByEmailUseCase } from '@application/usecases/account/FindAccountByEmailUseCase';
import { ListAccountsUseCase } from '@application/usecases/account/ListAccountsUseCase';
import { ListRoleChangesUseCase } from '@application/usecases/account/ListRoleChangesUseCase';

const emptyPage = { items: [], nextCursor: null };

let accounts: InMemoryAccountRepository;
let account: Account;

beforeEach(async () => {
  accounts = new InMemoryAccountRepository();
  account = Account.create({ name: 'Ana', email: 'ana@example.com' });
  await accounts.create(account);
});

describe('ListAccountsUseCase', () => {
  it('should ask the query for the role, status and page', async () => {
    const received: ListAccountsByRoleQuery.Input[] = [];
    const query: ListAccountsByRoleQuery = {
      execute: (input) => {
        received.push(input);
        return Promise.resolve(emptyPage);
      },
    };

    await new ListAccountsUseCase(query).execute({
      role: accountRoles.Student,
      status: 'ACTIVE',
      limit: 20,
      cursor: 'abc',
    });

    expect(received).toEqual([
      {
        role: 'student',
        status: 'ACTIVE',
        page: { limit: 20, cursor: 'abc' },
      },
    ]);
  });
});

describe('FindAccountByEmailUseCase', () => {
  it('should return the summary of the account with the e-mail', async () => {
    await expect(
      new FindAccountByEmailUseCase(accounts).execute({
        email: ' ANA@example.com',
      }),
    ).resolves.toEqual({
      id: account.id,
      name: 'Ana',
      email: 'ana@example.com',
      role: 'student',
      status: 'PENDING',
      createdAt: account.createdAt.toISOString(),
    });
  });

  it('should answer not found for an unknown e-mail', async () => {
    await expect(
      new FindAccountByEmailUseCase(accounts).execute({
        email: 'bia@example.com',
      }),
    ).rejects.toBeInstanceOf(AccountNotFound);
  });
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
        accountId: 'missing',
        limit: 20,
        cursor: undefined,
      }),
    ).rejects.toBeInstanceOf(AccountNotFound);
  });
});
