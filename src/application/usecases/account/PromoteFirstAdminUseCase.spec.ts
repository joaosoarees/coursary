import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';

import { Account, accountStatuses } from '@application/entities/Account';
import { AccountUnavailable } from '@application/errors/AccountUnavailable';
import { PromoteFirstAdminUseCase } from '@application/usecases/account/PromoteFirstAdminUseCase';

let accounts: InMemoryAccountRepository;
let promote: PromoteFirstAdminUseCase;
let account: Account;

beforeEach(async () => {
  accounts = new InMemoryAccountRepository();
  promote = new PromoteFirstAdminUseCase(accounts);
  account = Account.create({ name: 'Ana', email: 'ana@example.com' });
  await accounts.create(account);
  account.activate();
});

describe('PromoteFirstAdminUseCase', () => {
  it('should make an active account admin and record who did it', async () => {
    await expect(
      promote.execute({ email: ' Ana@Example.com ' }),
    ).resolves.toEqual({ accountId: account.id, changed: true });
    expect(account.role).toBe('admin');
    expect(accounts.roleChanges).toMatchObject([
      { fromRole: 'student', toRole: 'admin', changedBy: 'bootstrap' },
    ]);
  });

  it('should record nothing for an account that is already admin', async () => {
    await promote.execute({ email: 'ana@example.com' });

    await expect(
      promote.execute({ email: 'ana@example.com' }),
    ).resolves.toEqual({ accountId: account.id, changed: false });
    expect(accounts.roleChanges).toHaveLength(1);
  });

  it.each([accountStatuses.Pending, accountStatuses.Disabled])(
    'should refuse a %s account',
    async (status) => {
      account.status = status;

      await expect(
        promote.execute({ email: 'ana@example.com' }),
      ).rejects.toBeInstanceOf(AccountUnavailable);
      expect(accounts.roleChanges).toEqual([]);
    },
  );

  it('should refuse an unknown e-mail', async () => {
    await expect(
      promote.execute({ email: 'nobody@example.com' }),
    ).rejects.toBeInstanceOf(AccountUnavailable);
  });
});
