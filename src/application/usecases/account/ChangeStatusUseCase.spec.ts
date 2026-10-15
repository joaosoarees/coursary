import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';
import { anAccountId } from '@tests/ids';

import { Account, accountRoles } from '@application/entities/Account';
import { AccountNotActive, AccountNotFound } from '@application/errors/account';
import { CannotChangeOwnStatus } from '@application/errors/admin';
import { ChangeStatusUseCase } from '@application/usecases/account/ChangeStatusUseCase';

let accounts: InMemoryAccountRepository;
let changeStatus: ChangeStatusUseCase;
let admin: Account;
let target: Account;

const addAccount = async (name: string, role: Account.Role) => {
  const account = Account.create({ name, email: `${name}@example.com` });
  await accounts.create(account);
  account.activate();
  account.role = role;
  account.session = { accessJti: 'jti-1', refreshTokenHash: 'hash-1' };

  return account;
};

beforeEach(async () => {
  accounts = new InMemoryAccountRepository();
  changeStatus = new ChangeStatusUseCase(accounts);
  admin = await addAccount('ana', accountRoles.Admin);
  target = await addAccount('bia', accountRoles.Student);
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
});

const disable = (accountId = target.id) =>
  changeStatus.execute({ callerId: admin.id, accountId, status: 'DISABLED' });

describe('ChangeStatusUseCase', () => {
  it('should disable the account, end its session and log who did it', async () => {
    await expect(disable()).resolves.toEqual({
      id: target.id,
      status: 'DISABLED',
    });
    expect(target.status).toBe('DISABLED');
    expect(target.session).toBeUndefined();
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(`"changedBy":"${admin.id}"`),
    );
  });

  it('should enable a disabled account without bringing a session back', async () => {
    await disable();

    await changeStatus.execute({
      callerId: admin.id,
      accountId: target.id,
      status: 'ACTIVE',
    });

    expect(target.status).toBe('ACTIVE');
    expect(target.session).toBeUndefined();
  });

  it('should write nothing when the account already has the status', async () => {
    await disable();

    await expect(disable()).resolves.toEqual({
      id: target.id,
      status: 'DISABLED',
    });
    expect(accounts.statusChanges).toHaveLength(1);
  });

  it('should refuse the caller own account', async () => {
    await expect(disable(admin.id)).rejects.toBeInstanceOf(
      CannotChangeOwnStatus,
    );
  });

  it('should refuse an account that does not exist', async () => {
    await expect(disable(anAccountId())).rejects.toBeInstanceOf(
      AccountNotFound,
    );
  });

  it('should refuse a pending account', async () => {
    const pending = Account.create({ name: 'Caio', email: 'caio@example.com' });
    await accounts.create(pending);

    await expect(disable(pending.id)).rejects.toBeInstanceOf(AccountNotActive);
  });
});
