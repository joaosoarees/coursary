import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';

import { Account, accountStatuses } from '@application/entities/Account';
import { AccountUnavailable } from '@application/errors/AccountUnavailable';
import { GetMeUseCase } from '@application/usecases/account/GetMeUseCase';
import { UpdateMeUseCase } from '@application/usecases/account/UpdateMeUseCase';

let accounts: InMemoryAccountRepository;
let account: Account;

beforeEach(async () => {
  accounts = new InMemoryAccountRepository();
  account = Account.create({ name: 'Ana', email: 'ana@example.com' });
  await accounts.create(account);
  account.activate();
});

describe('GetMeUseCase', () => {
  it('should return the profile of an active account', async () => {
    await expect(
      new GetMeUseCase(accounts).execute({ accountId: account.id }),
    ).resolves.toEqual({
      id: account.id,
      name: 'Ana',
      email: 'ana@example.com',
      role: 'student',
      createdAt: account.createdAt.toISOString(),
    });
  });

  it.each([accountStatuses.Disabled, accountStatuses.Pending])(
    'should refuse a %s account',
    async (status) => {
      account.status = status;

      await expect(
        new GetMeUseCase(accounts).execute({ accountId: account.id }),
      ).rejects.toBeInstanceOf(AccountUnavailable);
    },
  );

  it('should refuse an account that no longer exists', async () => {
    await expect(
      new GetMeUseCase(accounts).execute({ accountId: 'missing' }),
    ).rejects.toBeInstanceOf(AccountUnavailable);
  });
});

describe('UpdateMeUseCase', () => {
  it('should rename the account and return the new profile', async () => {
    const profile = await new UpdateMeUseCase(accounts).execute({
      accountId: account.id,
      name: 'Ana Souza',
    });

    expect(profile.name).toBe('Ana Souza');
    expect(accounts.accounts.get(account.id)?.name).toBe('Ana Souza');
  });

  it('should not rename a disabled account', async () => {
    account.status = accountStatuses.Disabled;

    await expect(
      new UpdateMeUseCase(accounts).execute({
        accountId: account.id,
        name: 'Ana Souza',
      }),
    ).rejects.toBeInstanceOf(AccountUnavailable);
    expect(accounts.accounts.get(account.id)?.name).toBe('Ana');
  });
});
