import {
  Account,
  type AccountRole,
  type AccountStatus,
} from '@application/entities/Account';
import { expiresAtFromNow, PENDING_TTL_DAYS } from '@infra/database/dynamo/ttl';

export interface AccountItemType {
  PK: `ACCOUNT#${string}`;
  SK: `ACCOUNT#${string}`;
  GSI1PK: `ROLE#${AccountRole}`;
  GSI1SK: `ACCOUNT#${string}`;
  GSI2PK: `EMAIL#${string}`;
  GSI2SK: `ACCOUNT#${string}`;
  type: 'Account';
  id: string;
  externalId?: string;
  email: string;
  name: string;
  role: AccountRole;
  status: AccountStatus;
  createdAt: string;
  expiresAt?: number;
}

export const AccountItem = {
  getPK: (id: string) => `ACCOUNT#${id}` as const,
  getSK: (id: string) => `ACCOUNT#${id}` as const,

  fromEntity(account: Account): AccountItemType {
    return {
      PK: AccountItem.getPK(account.id),
      SK: AccountItem.getSK(account.id),
      GSI1PK: `ROLE#${account.role}`,
      GSI1SK: `ACCOUNT#${account.id}`,
      GSI2PK: `EMAIL#${account.email}`,
      GSI2SK: `ACCOUNT#${account.id}`,
      type: 'Account',
      id: account.id,
      ...(account.externalId ? { externalId: account.externalId } : {}),
      email: account.email,
      name: account.name,
      role: account.role,
      status: account.status,
      createdAt: account.createdAt.toISOString(),
      ...(account.status === 'PENDING'
        ? { expiresAt: expiresAtFromNow(PENDING_TTL_DAYS) }
        : {}),
    };
  },

  toEntity(item: AccountItemType): Account {
    return new Account({
      id: item.id,
      externalId: item.externalId,
      email: item.email,
      name: item.name,
      role: item.role,
      status: item.status,
      createdAt: new Date(item.createdAt),
    });
  },
};
