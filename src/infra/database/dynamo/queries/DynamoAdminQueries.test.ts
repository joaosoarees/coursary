import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, test } from 'vitest';

import { anAccountId } from '@tests/ids';

import type { Page } from '@application/contracts/Page';
import { Account, accountRoles } from '@application/entities/Account';
import { BOOTSTRAP_ACTOR, RoleChange } from '@application/entities/RoleChange';
import { InvalidCursor } from '@application/errors/InvalidCursor';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { AccountItem } from '@infra/database/dynamo/items/AccountItem';
import { RoleChangeItem } from '@infra/database/dynamo/items/RoleChangeItem';
import { DynamoListAccountsByRoleQuery } from '@infra/database/dynamo/queries/DynamoListAccountsByRoleQuery';
import { DynamoListRoleChangesQuery } from '@infra/database/dynamo/queries/DynamoListRoleChangesQuery';
import { AppConfig } from '@shared/config/AppConfig';

const config = new AppConfig();
const listAccounts = new DynamoListAccountsByRoleQuery(config);
const listRoleChanges = new DynamoListRoleChangesQuery(config);

async function putAccount(
  status: Account.Status,
  overrides: Partial<AccountItem.ItemType> = {},
) {
  const account = new Account({
    id: anAccountId(),
    externalId: undefined,
    email: `user-${crypto.randomUUID()}@example.com`,
    name: 'Ana',
    role: accountRoles.Instructor,
    status,
    createdAt: new Date(),
    session: undefined,
  });
  const Item = { ...AccountItem.fromEntity(account).toItem(), ...overrides };

  await dynamoClient.send(
    new PutCommand({ TableName: config.mainTableName, Item }),
  );

  return account;
}

// A KSUID keeps time to the second; ids from the same second sort by their random part.
const newestFirst = (ids: Iterable<string>) => [...ids].sort().reverse();

async function readAll<TItem>(
  read: (page: Page.Options) => Promise<Page<TItem>>,
  limit: number,
) {
  const items: TItem[] = [];
  let cursor: string | undefined;

  do {
    const page = await read({ limit, cursor });
    items.push(...page.items);
    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  return items;
}

describe('DynamoListAccountsByRoleQuery', () => {
  const instructors = (status?: Account.Status) => (page: Page.Options) =>
    listAccounts.execute({ role: accountRoles.Instructor, status, page });

  test('lists the accounts of a role, newest first, across pages', async () => {
    const created = [
      await putAccount('ACTIVE'),
      await putAccount('ACTIVE'),
      await putAccount('DISABLED'),
    ];
    const ids = new Set(created.map((account) => account.id));

    const listed = (await readAll(instructors(), 2)).filter((item) =>
      ids.has(Account.toId(item.id)),
    );

    expect(listed.map((item) => item.id)).toEqual(newestFirst(ids));
    expect(listed).toHaveLength(3);
  });

  test('keeps only the status asked for', async () => {
    const active = await putAccount('ACTIVE');
    const disabled = await putAccount('DISABLED');

    const listed = await readAll(instructors('DISABLED'), 2);
    const ids = listed.map((item) => item.id);

    expect(ids).toContain(disabled.id);
    expect(ids).not.toContain(active.id);
    expect(listed.every((item) => item.status === 'DISABLED')).toBe(true);
  });

  test('leaves out pending accounts whose time to live has passed', async () => {
    const expired = await putAccount('PENDING', {
      expiresAt: Math.floor(Date.now() / 1000) - 60,
    });
    const pending = await putAccount('PENDING');

    const ids = (await readAll(instructors('PENDING'), 50)).map(
      (item) => item.id,
    );

    expect(ids).toContain(pending.id);
    expect(ids).not.toContain(expired.id);
  });

  test('refuses a cursor from another role', async () => {
    await putAccount('ACTIVE');
    await putAccount('ACTIVE');
    const { nextCursor } = await instructors()({ limit: 1, cursor: undefined });

    await expect(
      listAccounts.execute({
        role: accountRoles.Admin,
        status: undefined,
        page: { limit: 1, cursor: nextCursor ?? undefined },
      }),
    ).rejects.toBeInstanceOf(InvalidCursor);
  });
});

describe('DynamoListRoleChangesQuery', () => {
  test('lists the role changes of an account, newest first', async () => {
    const account = await putAccount('ACTIVE');
    const changes = [];

    for (const toRole of ['admin', 'student', 'instructor'] as const) {
      const change = RoleChange.create({
        account,
        toRole,
        changedBy: BOOTSTRAP_ACTOR,
      });
      account.role = toRole;
      changes.push(change);
      await dynamoClient.send(
        new PutCommand({
          TableName: config.mainTableName,
          Item: RoleChangeItem.fromEntity(change).toItem(),
        }),
      );
    }

    const listed = await readAll(
      (page) => listRoleChanges.execute({ accountId: account.id, page }),
      2,
    );

    expect(listed.map((item) => item.id)).toEqual(
      newestFirst(changes.map((change) => change.id)),
    );
    expect(listed).toContainEqual(
      expect.objectContaining({
        fromRole: 'student',
        toRole: 'instructor',
        changedBy: 'bootstrap',
      }),
    );
  });
});
