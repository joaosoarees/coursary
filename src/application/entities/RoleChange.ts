import KSUID from 'ksuid';

import type { Account } from '@application/entities/Account';

export const BOOTSTRAP_ACTOR = 'bootstrap';

export class RoleChange {
  readonly id: string;
  readonly accountId: string;
  readonly changedBy: string;
  readonly fromRole: Account.Role;
  readonly toRole: Account.Role;
  readonly changedAt: Date;

  constructor(attributes: RoleChange.Attributes) {
    this.id = attributes.id;
    this.accountId = attributes.accountId;
    this.changedBy = attributes.changedBy;
    this.fromRole = attributes.fromRole;
    this.toRole = attributes.toRole;
    this.changedAt = attributes.changedAt;
  }

  static create({
    account,
    toRole,
    changedBy,
  }: {
    account: Account;
    toRole: Account.Role;
    changedBy: string;
  }): RoleChange {
    return new RoleChange({
      id: KSUID.randomSync().string,
      accountId: account.id,
      changedBy,
      fromRole: account.role,
      toRole,
      changedAt: new Date(),
    });
  }
}

export namespace RoleChange {
  export interface Attributes {
    id: string;
    accountId: string;
    changedBy: string;
    fromRole: Account.Role;
    toRole: Account.Role;
    changedAt: Date;
  }
}
