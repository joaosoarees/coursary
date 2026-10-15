import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';
import { anAccountId } from '@tests/ids';

import { Account, accountRoles } from '@application/entities/Account';
import { AccountNotActive } from '@application/errors/AccountNotActive';
import { AccountNotFound } from '@application/errors/AccountNotFound';
import { CannotChangeOwnRole } from '@application/errors/CannotChangeOwnRole';
import { Forbidden } from '@application/errors/Forbidden';
import { ChangeRoleUseCase } from '@application/usecases/account/ChangeRoleUseCase';

let accounts: InMemoryAccountRepository;
let changeRole: ChangeRoleUseCase;
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
  changeRole = new ChangeRoleUseCase(accounts);
  admin = await addAccount('ana', accountRoles.Admin);
  target = await addAccount('bia', accountRoles.Student);
});

describe('ChangeRoleUseCase', () => {
  it('should change the role and record who changed it', async () => {
    await expect(
      changeRole.execute({
        callerId: admin.id,
        accountId: target.id,
        role: accountRoles.Instructor,
      }),
    ).resolves.toEqual({ id: target.id, role: 'instructor' });
    expect(target.role).toBe('instructor');
    expect(accounts.roleChanges).toMatchObject([
      { fromRole: 'student', toRole: 'instructor', changedBy: admin.id },
    ]);
  });

  it('should record nothing when the account already has the role', async () => {
    await expect(
      changeRole.execute({
        callerId: admin.id,
        accountId: target.id,
        role: accountRoles.Student,
      }),
    ).resolves.toEqual({ id: target.id, role: 'student' });
    expect(accounts.roleChanges).toHaveLength(0);
  });

  it('should refuse a change to the caller own role', async () => {
    await expect(
      changeRole.execute({
        callerId: admin.id,
        accountId: admin.id,
        role: accountRoles.Student,
      }),
    ).rejects.toBeInstanceOf(CannotChangeOwnRole);
  });

  it('should refuse an account that does not exist', async () => {
    await expect(
      changeRole.execute({
        callerId: admin.id,
        accountId: anAccountId(),
        role: accountRoles.Admin,
      }),
    ).rejects.toBeInstanceOf(AccountNotFound);
  });

  it('should refuse an account that is not active', async () => {
    const pending = Account.create({ name: 'Caio', email: 'caio@example.com' });
    await accounts.create(pending);

    await expect(
      changeRole.execute({
        callerId: admin.id,
        accountId: pending.id,
        role: accountRoles.Admin,
      }),
    ).rejects.toBeInstanceOf(AccountNotActive);
  });

  it('should refuse a caller who is no longer admin', async () => {
    admin.role = accountRoles.Student;

    await expect(
      changeRole.execute({
        callerId: admin.id,
        accountId: target.id,
        role: accountRoles.Admin,
      }),
    ).rejects.toBeInstanceOf(Forbidden);
  });
});
