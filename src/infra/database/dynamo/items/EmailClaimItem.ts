import { expiresAtFromNow, PENDING_TTL_DAYS } from '@infra/database/dynamo/ttl';

export class EmailClaimItem {
  static readonly type = 'EmailClaim';

  private readonly keys: EmailClaimItem.Keys;

  constructor(private readonly attributes: EmailClaimItem.Attributes) {
    this.keys = {
      PK: EmailClaimItem.getPK(attributes.email),
      SK: EmailClaimItem.getSK(attributes.email),
    };
  }

  toItem(): EmailClaimItem.ItemType {
    return { ...this.keys, ...this.attributes, type: EmailClaimItem.type };
  }

  static forPendingAccount(email: string, accountId: string): EmailClaimItem {
    return new EmailClaimItem({
      email,
      accountId,
      expiresAt: expiresAtFromNow(PENDING_TTL_DAYS),
    });
  }

  static getPK(email: string): EmailClaimItem.Keys['PK'] {
    return `EMAIL_CLAIM#${email}`;
  }

  static getSK(email: string): EmailClaimItem.Keys['SK'] {
    return `EMAIL_CLAIM#${email}`;
  }
}

export namespace EmailClaimItem {
  export interface Keys {
    PK: `EMAIL_CLAIM#${string}`;
    SK: `EMAIL_CLAIM#${string}`;
  }

  export interface Attributes {
    email: string;
    accountId: string;
    expiresAt?: number;
  }

  export type ItemType = Keys & Attributes & { type: 'EmailClaim' };
}
