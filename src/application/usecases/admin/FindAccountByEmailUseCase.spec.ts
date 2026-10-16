import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';

import { Account } from '@application/entities/account/Account';
import { AccountNotFound } from '@application/errors/account';
import { FindAccountByEmailUseCase } from '@application/usecases/admin/FindAccountByEmailUseCase';

let accounts: InMemoryAccountRepository;
let account: Account;

beforeEach(async () => {
  accounts = new InMemoryAccountRepository();
  account = Account.create({ name: 'Ana', email: 'ana@example.com' });
  await accounts.create(account);
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
