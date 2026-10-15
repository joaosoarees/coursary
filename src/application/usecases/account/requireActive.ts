import { type Account, accountStatuses } from '@application/entities/Account';
import { AccountUnavailable } from '@application/errors/AccountUnavailable';

export function requireActive(account: Account | null): Account {
  if (account?.status !== accountStatuses.Active) {
    throw new AccountUnavailable();
  }

  return account;
}
