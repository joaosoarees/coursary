import type { AccountId } from '@application/entities/AccountId';
import { expiresAtFromNow, PENDING_TTL_DAYS } from '@infra/database/dynamo/ttl';

export interface EmailClaimItemType {
  PK: `EMAIL_CLAIM#${string}`;
  SK: `EMAIL_CLAIM#${string}`;
  type: 'EmailClaim';
  accountId: string;
  expiresAt?: number;
}

export const EmailClaimItem = {
  getKey: (email: string) =>
    ({
      PK: `EMAIL_CLAIM#${email}`,
      SK: `EMAIL_CLAIM#${email}`,
    }) as const,

  forPendingAccount(email: string, accountId: AccountId): EmailClaimItemType {
    return {
      ...EmailClaimItem.getKey(email),
      type: 'EmailClaim',
      accountId,
      expiresAt: expiresAtFromNow(PENDING_TTL_DAYS),
    };
  },
};
