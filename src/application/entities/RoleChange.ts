import KSUID from 'ksuid';

import type { Account } from '@application/entities/Account';

export const BOOTSTRAP_ACTOR = 'bootstrap' as const;

export class RoleChange {
  readonly id: string;
  readonly accountId: Account.Id;
  readonly changedBy: RoleChange.Actor;
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
    changedBy: RoleChange.Actor;
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
  export type Actor = Account.Id | typeof BOOTSTRAP_ACTOR;

  export interface Attributes {
    id: string;
    accountId: Account.Id;
    changedBy: Actor;
    fromRole: Account.Role;
    toRole: Account.Role;
    changedAt: Date;
  }
}
