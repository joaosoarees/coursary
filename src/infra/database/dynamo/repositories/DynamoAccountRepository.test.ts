import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, test } from 'vitest';

import { Account } from '@application/entities/Account';
import { EmailInUse } from '@application/errors/EmailInUse';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { DynamoAccountRepository } from '@infra/database/dynamo/repositories/DynamoAccountRepository';
import { AppConfig } from '@shared/config/AppConfig';

const config = new AppConfig();
const repository = new DynamoAccountRepository(config);

const uniqueEmail = () => `user-${crypto.randomUUID()}@example.com`;

async function getItem(PK: string) {
  const { Item } = await dynamoClient.send(
    new GetCommand({
      TableName: config.mainTableName,
      Key: { PK, SK: PK },
      ConsistentRead: true,
    }),
  );

  return Item;
}

describe('DynamoAccountRepository.create', () => {
  test('writes the account and the claim on its e-mail', async () => {
    const account = Account.create({ name: 'Ana', email: uniqueEmail() });

    await repository.create(account);

    expect(await getItem(`ACCOUNT#${account.id}`)).toMatchObject({
      type: 'Account',
      email: account.email,
      status: 'PENDING',
    });
    expect(await getItem(`EMAIL_CLAIM#${account.email}`)).toMatchObject({
      type: 'EmailClaim',
      accountId: account.id,
    });
  });

  test('refuses a second account with the same e-mail and writes nothing for it', async () => {
    const email = uniqueEmail();
    await repository.create(Account.create({ name: 'Ana', email }));
    const second = Account.create({ name: 'Bia', email });

    await expect(repository.create(second)).rejects.toBeInstanceOf(EmailInUse);
    expect(await getItem(`ACCOUNT#${second.id}`)).toBeUndefined();
  });

  test('treats e-mails that differ only in case as the same address', async () => {
    const email = uniqueEmail();
    await repository.create(Account.create({ name: 'Ana', email }));

    await expect(
      repository.create(
        Account.create({ name: 'Bia', email: email.toUpperCase() }),
      ),
    ).rejects.toBeInstanceOf(EmailInUse);
  });

  test('lets only one of two simultaneous sign-ups with the same e-mail through', async () => {
    const email = uniqueEmail();

    const results = await Promise.allSettled([
      repository.create(Account.create({ name: 'Ana', email })),
      repository.create(Account.create({ name: 'Bia', email })),
    ]);

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
      1,
    );
  });
});

describe('DynamoAccountRepository.delete', () => {
  test('removes the account and frees its e-mail', async () => {
    const email = uniqueEmail();
    const account = Account.create({ name: 'Ana', email });
    await repository.create(account);

    await repository.delete(account);

    expect(await getItem(`ACCOUNT#${account.id}`)).toBeUndefined();
    expect(await getItem(`EMAIL_CLAIM#${email}`)).toBeUndefined();
    await expect(
      repository.create(Account.create({ name: 'Bia', email })),
    ).resolves.toBeUndefined();
  });

  test('does not release a claim that belongs to another account', async () => {
    const email = uniqueEmail();
    await repository.create(Account.create({ name: 'Ana', email }));
    const stranger = Account.create({ name: 'Bia', email });

    await expect(repository.delete(stranger)).rejects.toThrow();
    expect(await getItem(`EMAIL_CLAIM#${email}`)).toBeDefined();
  });
});
