import {
  Account,
  accountRoles,
  accountStatuses,
} from '@application/entities/Account';
import type { RoleChange } from '@application/entities/RoleChange';
import { AccountConflict } from '@application/errors/AccountConflict';
import { EmailInUse } from '@application/errors/EmailInUse';
import { Forbidden } from '@application/errors/Forbidden';
import { InvalidSession } from '@application/errors/InvalidSession';
import type { AccountRepository } from '@application/repositories/AccountRepository';

export class InMemoryAccountRepository implements AccountRepository {
  readonly accounts = new Map<string, Account>();
  readonly claims = new Map<string, string>();
  failOnSaveExternalId: Error | undefined;
  failOnActivate: Error | undefined;
  readonly roleChanges: RoleChange[] = [];
  readonly statusChanges: AccountRepository.StatusChange[] = [];
  failOnChangeStatus: Error | undefined;

  create(account: Account): Promise<void> {
    if (this.claims.has(account.email)) {
      return Promise.reject(new EmailInUse());
    }

    this.accounts.set(account.id, account);
    this.claims.set(account.email, account.id);

    return Promise.resolve();
  }

  delete(account: Account): Promise<void> {
    this.accounts.delete(account.id);

    if (this.claims.get(account.email) === account.id) {
      this.claims.delete(account.email);
    }

    return Promise.resolve();
  }

  saveExternalId(account: Account): Promise<void> {
    if (this.failOnSaveExternalId) {
      return Promise.reject(this.failOnSaveExternalId);
    }

    this.accounts.set(account.id, account);

    return Promise.resolve();
  }

  findById(id: string): Promise<Account | null> {
    return Promise.resolve(this.accounts.get(id) ?? null);
  }

  findByEmail(email: string): Promise<Account | null> {
    const accountId = this.claims.get(Account.normalizeEmail(email));
    const account = accountId ? this.accounts.get(accountId) : undefined;

    return Promise.resolve(
      account
        ? new Account({
            id: account.id,
            externalId: account.externalId,
            email: account.email,
            name: account.name,
            role: account.role,
            status: account.status,
            createdAt: account.createdAt,
            session: account.session,
          })
        : null,
    );
  }

  activate(account: Account): Promise<void> {
    if (this.failOnActivate) {
      return Promise.reject(this.failOnActivate);
    }

    this.accounts.set(account.id, account);

    return Promise.resolve();
  }

  updateName(id: string, name: string): Promise<Account> {
    const account = this.accounts.get(id);

    if (!account) {
      return Promise.reject(new Error(`Account ${id} does not exist.`));
    }

    account.name = name;

    return Promise.resolve(account);
  }

  changeRole(
    roleChange: RoleChange,
    { adminCallerId }: AccountRepository.ChangeRoleOptions = {},
  ): Promise<void> {
    if (adminCallerId && !this.isActiveAdmin(adminCallerId)) {
      return Promise.reject(new Forbidden());
    }

    const account = this.accounts.get(roleChange.accountId);

    if (account?.role !== roleChange.fromRole) {
      return Promise.reject(new Error('The role changed in the meantime.'));
    }

    account.role = roleChange.toRole;
    this.roleChanges.push(roleChange);

    return Promise.resolve();
  }

  saveSession(accountId: string, session: Account.Session): Promise<void> {
    const account = this.accounts.get(accountId);

    if (!account) {
      return Promise.reject(new Error(`Account ${accountId} does not exist.`));
    }

    account.session = session;

    return Promise.resolve();
  }

  rotateSession(
    accountId: string,
    previousRefreshTokenHash: string,
    session: Account.Session,
  ): Promise<void> {
    const account = this.accounts.get(accountId);

    if (account?.session?.refreshTokenHash !== previousRefreshTokenHash) {
      return Promise.reject(new InvalidSession());
    }

    account.session = session;

    return Promise.resolve();
  }

  clearSession(accountId: string): Promise<void> {
    const account = this.accounts.get(accountId);

    if (account) {
      account.session = undefined;
    }

    return Promise.resolve();
  }

  changeStatus(
    { accountId, fromStatus, toStatus }: AccountRepository.StatusChange,
    adminCallerId: string,
  ): Promise<void> {
    if (this.failOnChangeStatus) {
      return Promise.reject(this.failOnChangeStatus);
    }

    if (!this.isActiveAdmin(adminCallerId)) {
      return Promise.reject(new Forbidden());
    }

    const account = this.accounts.get(accountId);

    if (account?.status !== fromStatus) {
      return Promise.reject(new AccountConflict());
    }

    account.status = toStatus;
    this.statusChanges.push({ accountId, fromStatus, toStatus });

    return Promise.resolve();
  }

  private isActiveAdmin(accountId: string): boolean {
    const account = this.accounts.get(accountId);

    return (
      account?.role === accountRoles.Admin &&
      account.status === accountStatuses.Active
    );
  }
}
