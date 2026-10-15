import {
  Account,
  accountStatuses,
  normalizeEmail,
} from '@application/entities/Account';
import { EmailInUse } from '@application/errors/EmailInUse';
import type { AccountRepository } from '@application/repositories/AccountRepository';

export class InMemoryAccountRepository implements AccountRepository {
  readonly accounts = new Map<string, Account>();
  readonly claims = new Map<string, string>();
  failOnSaveExternalId: Error | undefined;
  failOnActivate: Error | undefined;

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

  findPendingByEmail(email: string): Promise<Account | null> {
    const accountId = this.claims.get(normalizeEmail(email));
    const account = accountId ? this.accounts.get(accountId) : undefined;

    return Promise.resolve(
      account?.status === accountStatuses.Pending
        ? new Account({
            id: account.id,
            externalId: account.externalId,
            email: account.email,
            name: account.name,
            role: account.role,
            status: account.status,
            createdAt: account.createdAt,
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
}
