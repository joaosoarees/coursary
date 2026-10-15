import type { Account } from '@application/entities/Account';
import { EmailInUse } from '@application/errors/EmailInUse';
import { AccountRepository } from '@application/repositories/AccountRepository';

export class InMemoryAccountRepository extends AccountRepository {
  readonly accounts = new Map<string, Account>();
  readonly claims = new Map<string, string>();
  failOnSaveExternalId: Error | undefined;

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
}
