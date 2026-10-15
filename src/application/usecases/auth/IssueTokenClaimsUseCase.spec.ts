import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';

import { Account, accountStatuses } from '@application/entities/Account';
import { AccountUnavailable } from '@application/errors/AccountUnavailable';
import { IssueTokenClaimsUseCase } from '@application/usecases/auth/IssueTokenClaimsUseCase';

let accounts: InMemoryAccountRepository;
let issueClaims: IssueTokenClaimsUseCase;
let account: Account;

beforeEach(() => {
  accounts = new InMemoryAccountRepository();
  issueClaims = new IssueTokenClaimsUseCase(accounts);
  account = Account.create({ name: 'Ana', email: 'ana@example.com' });
  account.activate();
  accounts.accounts.set(account.id, account);
});

describe('IssueTokenClaimsUseCase', () => {
  it('should give the internal id and the role of an active account', async () => {
    await expect(
      issueClaims.execute({ internalId: account.id }),
    ).resolves.toEqual({ internalId: account.id, role: 'student' });
  });

  it('should refuse an account that does not exist', async () => {
    await expect(
      issueClaims.execute({ internalId: 'missing' }),
    ).rejects.toBeInstanceOf(AccountUnavailable);
  });

  it.each([accountStatuses.Pending, accountStatuses.Disabled])(
    'should refuse a %s account',
    async (status) => {
      account.status = status;

      await expect(
        issueClaims.execute({ internalId: account.id }),
      ).rejects.toBeInstanceOf(AccountUnavailable);
    },
  );
});
