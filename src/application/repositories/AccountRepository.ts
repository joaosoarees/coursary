import type { Account } from '@application/entities/Account';

export interface AccountRepository {
  create(account: Account): Promise<void>;

  delete(account: Account): Promise<void>;

  saveExternalId(account: Account): Promise<void>;

  findById(id: string): Promise<Account | null>;

  findPendingByEmail(email: string): Promise<Account | null>;

  activate(account: Account): Promise<void>;
}
