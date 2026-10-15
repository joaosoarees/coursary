import type { Account } from '@application/entities/Account';

export interface AccountProfile {
  id: string;
  name: string;
  email: string;
  role: Account.Role;
  createdAt: string;
}

export function toAccountProfile(account: Account): AccountProfile {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    createdAt: account.createdAt.toISOString(),
  };
}
