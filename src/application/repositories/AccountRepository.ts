import type { Account } from '@application/entities/Account';

export abstract class AccountRepository {
  abstract create(account: Account): Promise<void>;

  abstract delete(account: Account): Promise<void>;

  abstract saveExternalId(account: Account): Promise<void>;
}
