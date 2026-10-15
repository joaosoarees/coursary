import { describe, expect, it } from 'vitest';

import { Account, accountRoles } from '@application/entities/Account';
import { BOOTSTRAP_ACTOR, RoleChange } from '@application/entities/RoleChange';
import { RoleChangeItem } from '@infra/database/dynamo/items/RoleChangeItem';

describe('RoleChangeItem', () => {
  it('should keep the change under the account, sorted by its KSUID', () => {
    const account = Account.create({ name: 'Ana', email: 'ana@example.com' });
    const change = RoleChange.create({
      account,
      toRole: accountRoles.Admin,
      changedBy: BOOTSTRAP_ACTOR,
    });

    const item = RoleChangeItem.fromEntity(change).toItem();

    expect(item).toMatchObject({
      PK: `ACCOUNT#${account.id}`,
      SK: `ROLE_CHANGE#${change.id}`,
      type: 'RoleChange',
      fromRole: 'student',
      toRole: 'admin',
      changedBy: 'bootstrap',
    });
    expect(RoleChangeItem.toEntity(item)).toEqual(change);
  });
});
