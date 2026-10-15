import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeAuthGateway } from '@tests/fakes/FakeAuthGateway';
import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';

import { Account, accountRoles } from '@application/entities/Account';
import { AccountNotActive } from '@application/errors/AccountNotActive';
import { AccountNotFound } from '@application/errors/AccountNotFound';
import { CannotChangeOwnStatus } from '@application/errors/CannotChangeOwnStatus';
import { ChangeStatusUseCase } from '@application/usecases/account/ChangeStatusUseCase';

let accounts: InMemoryAccountRepository;
let auth: FakeAuthGateway;
let changeStatus: ChangeStatusUseCase;
let admin: Account;
let target: Account;

const addAccount = async (name: string, role: Account.Role) => {
  const account = Account.create({ name, email: `${name}@example.com` });
  await accounts.create(account);
  account.activate();
  account.role = role;

  return account;
};

beforeEach(async () => {
  accounts = new InMemoryAccountRepository();
  auth = new FakeAuthGateway();
  changeStatus = new ChangeStatusUseCase(accounts, auth);
  admin = await addAccount('ana', accountRoles.Admin);
  target = await addAccount('bia', accountRoles.Student);
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

const disable = (accountId = target.id) =>
  changeStatus.execute({ callerId: admin.id, accountId, status: 'DISABLED' });

describe('ChangeStatusUseCase', () => {
  it('should disable the account and then the user in Cognito', async () => {
    await expect(disable()).resolves.toEqual({
      id: target.id,
      status: 'DISABLED',
    });
    expect(target.status).toBe('DISABLED');
    expect(auth.disabled.has('bia@example.com')).toBe(true);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"changedBy":"' + admin.id + '"'),
    );
  });

  it('should enable a disabled account and the user in Cognito', async () => {
    await disable();

    await changeStatus.execute({
      callerId: admin.id,
      accountId: target.id,
      status: 'ACTIVE',
    });

    expect(target.status).toBe('ACTIVE');
    expect(auth.disabled.has('bia@example.com')).toBe(false);
  });

  it('should keep the account disabled and log when Cognito fails', async () => {
    auth.failOnStatus = new Error('Cognito is down');

    await expect(disable()).rejects.toThrow('Cognito is down');
    expect(target.status).toBe('DISABLED');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('CognitoStatusNotSynced'),
    );
  });

  it('should repair Cognito on a new call without writing the account again', async () => {
    auth.failOnStatus = new Error('Cognito is down');
    await disable().catch(() => undefined);
    auth.failOnStatus = undefined;

    await expect(disable()).resolves.toEqual({
      id: target.id,
      status: 'DISABLED',
    });
    expect(accounts.statusChanges).toHaveLength(1);
    expect(auth.disabled.has('bia@example.com')).toBe(true);
  });

  it('should refuse the caller own account', async () => {
    await expect(disable(admin.id)).rejects.toBeInstanceOf(
      CannotChangeOwnStatus,
    );
  });

  it('should refuse an account that does not exist', async () => {
    await expect(disable('missing')).rejects.toBeInstanceOf(AccountNotFound);
  });

  it('should refuse a pending account', async () => {
    const pending = Account.create({ name: 'Caio', email: 'caio@example.com' });
    await accounts.create(pending);

    await expect(disable(pending.id)).rejects.toBeInstanceOf(AccountNotActive);
    expect(auth.disabled.size).toBe(0);
  });
});
