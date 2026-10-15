import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
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

  test('takes over a claim that has expired but was not yet removed by TTL', async () => {
    const email = uniqueEmail();
    await dynamoClient.send(
      new PutCommand({
        TableName: config.mainTableName,
        Item: {
          PK: `EMAIL_CLAIM#${email}`,
          SK: `EMAIL_CLAIM#${email}`,
          type: 'EmailClaim',
          email,
          accountId: 'abandoned',
          expiresAt: Math.floor(Date.now() / 1000) - 60,
        },
      }),
    );
    const account = Account.create({ name: 'Ana', email });

    await repository.create(account);

    expect(await getItem(`EMAIL_CLAIM#${email}`)).toMatchObject({
      accountId: account.id,
    });
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

describe('DynamoAccountRepository.saveExternalId', () => {
  test('stores the identity provider id on the account', async () => {
    const account = Account.create({ name: 'Ana', email: uniqueEmail() });
    await repository.create(account);
    account.externalId = 'cognito-sub-1';

    await repository.saveExternalId(account);

    expect(await getItem(`ACCOUNT#${account.id}`)).toMatchObject({
      externalId: 'cognito-sub-1',
    });
  });

  test('refuses an account that does not exist', async () => {
    const account = Account.create({ name: 'Ana', email: uniqueEmail() });
    account.externalId = 'cognito-sub-1';

    await expect(repository.saveExternalId(account)).rejects.toThrow();
    expect(await getItem(`ACCOUNT#${account.id}`)).toBeUndefined();
  });
});

describe('DynamoAccountRepository.findByEmail', () => {
  test('finds a pending account through the claim on its e-mail', async () => {
    const email = uniqueEmail();
    const account = Account.create({ name: 'Ana', email });
    await repository.create(account);

    const found = await repository.findByEmail(` ${email.toUpperCase()} `);

    expect(found).toMatchObject({ id: account.id, email, status: 'PENDING' });
  });

  test('finds nothing for an unknown e-mail', async () => {
    await expect(repository.findByEmail(uniqueEmail())).resolves.toBeNull();
  });

  test('finds nothing once the claim has expired', async () => {
    const account = Account.create({ name: 'Ana', email: uniqueEmail() });
    await repository.create(account);
    await dynamoClient.send(
      new UpdateCommand({
        TableName: config.mainTableName,
        Key: {
          PK: `EMAIL_CLAIM#${account.email}`,
          SK: `EMAIL_CLAIM#${account.email}`,
        },
        UpdateExpression: 'SET expiresAt = :past',
        ExpressionAttributeValues: {
          ':past': Math.floor(Date.now() / 1000) - 60,
        },
      }),
    );

    await expect(repository.findByEmail(account.email)).resolves.toBeNull();
  });

  test('finds an active account as well', async () => {
    const account = Account.create({ name: 'Ana', email: uniqueEmail() });
    await repository.create(account);
    account.activate();
    await repository.activate(account);

    await expect(repository.findByEmail(account.email)).resolves.toMatchObject({
      id: account.id,
      status: 'ACTIVE',
    });
  });
});

describe('DynamoAccountRepository.activate', () => {
  test('marks the account active and keeps it and its claim for good', async () => {
    const account = Account.create({ name: 'Ana', email: uniqueEmail() });
    await repository.create(account);
    account.activate();

    await repository.activate(account);

    const accountItem = await getItem(`ACCOUNT#${account.id}`);
    const claimItem = await getItem(`EMAIL_CLAIM#${account.email}`);
    expect(accountItem).toMatchObject({ status: 'ACTIVE' });
    expect(accountItem).not.toHaveProperty('expiresAt');
    expect(claimItem).toMatchObject({ accountId: account.id });
    expect(claimItem).not.toHaveProperty('expiresAt');
  });

  test('refuses an account that is no longer pending', async () => {
    const account = Account.create({ name: 'Ana', email: uniqueEmail() });
    await repository.create(account);
    account.activate();
    await repository.activate(account);

    await expect(repository.activate(account)).rejects.toThrow();
  });
});

describe('DynamoAccountRepository.findById', () => {
  test('finds an account by its id', async () => {
    const account = Account.create({ name: 'Ana', email: uniqueEmail() });
    await repository.create(account);

    await expect(repository.findById(account.id)).resolves.toMatchObject({
      id: account.id,
      email: account.email,
      role: 'student',
    });
  });

  test('finds nothing for an unknown id', async () => {
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  test('finds nothing once the account has expired', async () => {
    const account = Account.create({ name: 'Ana', email: uniqueEmail() });
    await repository.create(account);
    await dynamoClient.send(
      new UpdateCommand({
        TableName: config.mainTableName,
        Key: { PK: `ACCOUNT#${account.id}`, SK: `ACCOUNT#${account.id}` },
        UpdateExpression: 'SET expiresAt = :past',
        ExpressionAttributeValues: {
          ':past': Math.floor(Date.now() / 1000) - 60,
        },
      }),
    );

    await expect(repository.findById(account.id)).resolves.toBeNull();
  });
});

describe('DynamoAccountRepository.updateName', () => {
  test('changes the name and returns the account as stored', async () => {
    const account = Account.create({ name: 'Ana', email: uniqueEmail() });
    await repository.create(account);

    const updated = await repository.updateName(account.id, 'Ana Souza');

    expect(updated).toMatchObject({
      id: account.id,
      name: 'Ana Souza',
      email: account.email,
    });
    expect(await getItem(`ACCOUNT#${account.id}`)).toMatchObject({
      name: 'Ana Souza',
    });
  });

  test('refuses an account that does not exist', async () => {
    await expect(repository.updateName('missing', 'Ana')).rejects.toThrow();
    expect(await getItem('ACCOUNT#missing')).toBeUndefined();
  });
});
