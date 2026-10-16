import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';
import { InMemoryCourseRepository } from '@tests/fakes/InMemoryCourseRepository';

import {
  Account,
  accountStatuses,
} from '@application/entities/account/Account';
import { AccountUnavailable } from '@application/errors/auth';
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
  it('should return the profile of an active account', () => {
    expect(new GetMeUseCase().execute({ account })).toEqual({
      id: account.id,
      name: 'Ana',
      email: 'ana@example.com',
      role: 'student',
      createdAt: account.createdAt.toISOString(),
    });
  });

  it.each([accountStatuses.Disabled, accountStatuses.Pending])(
    'should refuse a %s account',
    (status) => {
      account.status = status;

      expect(() => new GetMeUseCase().execute({ account })).toThrow(
        AccountUnavailable,
      );
    },
  );
});

describe('UpdateMeUseCase', () => {
  it('should rename the account and return the new profile', async () => {
    const profile = await new UpdateMeUseCase(
      accounts,
      new InMemoryCourseRepository(),
    ).execute({
      account,
      name: 'Ana Souza',
    });

    expect(profile.name).toBe('Ana Souza');
    expect(accounts.accounts.get(account.id)?.name).toBe('Ana Souza');
  });

  it('should not rename a disabled account', async () => {
    account.status = accountStatuses.Disabled;

    await expect(
      new UpdateMeUseCase(accounts, new InMemoryCourseRepository()).execute({
        account,
        name: 'Ana Souza',
      }),
    ).rejects.toBeInstanceOf(AccountUnavailable);
    expect(accounts.accounts.get(account.id)?.name).toBe('Ana');
  });
});
