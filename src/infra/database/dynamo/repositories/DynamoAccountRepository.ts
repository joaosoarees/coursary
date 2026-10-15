import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';
import {
  GetCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import {
  type Account,
  accountStatuses,
  normalizeEmail,
} from '@application/entities/Account';
import { EmailInUse } from '@application/errors/EmailInUse';
import type { AccountRepository } from '@application/repositories/AccountRepository';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { AccountItem } from '@infra/database/dynamo/items/AccountItem';
import { EmailClaimItem } from '@infra/database/dynamo/items/EmailClaimItem';
import { AppConfig } from '@shared/config/AppConfig';

export class DynamoAccountRepository implements AccountRepository {
  constructor(private readonly config: AppConfig) {}

  async create(account: Account): Promise<void> {
    const TableName = this.config.mainTableName;

    try {
      await dynamoClient.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName,
                Item: AccountItem.fromEntity(account).toItem(),
                ConditionExpression: 'attribute_not_exists(PK)',
              },
            },
            {
              Put: {
                TableName,
                Item: EmailClaimItem.fromEntity(account).toItem(),
                ConditionExpression:
                  'attribute_not_exists(PK) OR expiresAt < :now',
                ExpressionAttributeValues: {
                  ':now': nowInSeconds(),
                },
              },
            },
          ],
        }),
      );
    } catch (error) {
      const claimFailed =
        error instanceof TransactionCanceledException &&
        error.CancellationReasons?.[1]?.Code === 'ConditionalCheckFailed';

      if (claimFailed) {
        throw new EmailInUse();
      }

      throw error;
    }
  }

  async delete(account: Account): Promise<void> {
    const TableName = this.config.mainTableName;

    await dynamoClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Delete: {
              TableName,
              Key: {
                PK: AccountItem.getPK(account.id),
                SK: AccountItem.getSK(account.id),
              },
            },
          },
          {
            Delete: {
              TableName,
              Key: {
                PK: EmailClaimItem.getPK(account.email),
                SK: EmailClaimItem.getSK(account.email),
              },
              ConditionExpression: 'accountId = :accountId',
              ExpressionAttributeValues: { ':accountId': account.id },
            },
          },
        ],
      }),
    );
  }

  async saveExternalId(account: Account): Promise<void> {
    await dynamoClient.send(
      new UpdateCommand({
        TableName: this.config.mainTableName,
        Key: {
          PK: AccountItem.getPK(account.id),
          SK: AccountItem.getSK(account.id),
        },
        UpdateExpression: 'SET externalId = :externalId',
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeValues: { ':externalId': account.externalId },
      }),
    );
  }

  async findById(
    id: string,
    { consistent = true }: AccountRepository.ReadOptions = {},
  ): Promise<Account | null> {
    const item = await this.getLive<AccountItem.ItemType>(
      { PK: AccountItem.getPK(id), SK: AccountItem.getSK(id) },
      consistent,
    );

    return item ? AccountItem.toEntity(item) : null;
  }

  async findByEmail(email: string): Promise<Account | null> {
    const normalized = normalizeEmail(email);
    const claim = await this.getLive<EmailClaimItem.ItemType>({
      PK: EmailClaimItem.getPK(normalized),
      SK: EmailClaimItem.getSK(normalized),
    });

    return claim ? this.findById(claim.accountId) : null;
  }

  async activate(account: Account): Promise<void> {
    const TableName = this.config.mainTableName;

    await dynamoClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName,
              Key: {
                PK: AccountItem.getPK(account.id),
                SK: AccountItem.getSK(account.id),
              },
              UpdateExpression: 'SET #status = :status REMOVE expiresAt',
              ConditionExpression: '#status = :pending',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: {
                ':status': account.status,
                ':pending': accountStatuses.Pending,
              },
            },
          },
          {
            Update: {
              TableName,
              Key: {
                PK: EmailClaimItem.getPK(account.email),
                SK: EmailClaimItem.getSK(account.email),
              },
              UpdateExpression: 'REMOVE expiresAt',
              ConditionExpression: 'accountId = :accountId',
              ExpressionAttributeValues: { ':accountId': account.id },
            },
          },
        ],
      }),
    );
  }

  async updateName(id: string, name: string): Promise<Account> {
    const { Attributes } = await dynamoClient.send(
      new UpdateCommand({
        TableName: this.config.mainTableName,
        Key: { PK: AccountItem.getPK(id), SK: AccountItem.getSK(id) },
        UpdateExpression: 'SET #name = :name',
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: { ':name': name },
        ReturnValues: 'ALL_NEW',
      }),
    );

    return AccountItem.toEntity(Attributes as AccountItem.ItemType);
  }

  private async getLive<TItem extends { expiresAt?: number }>(
    Key: Record<string, string>,
    consistent = true,
  ): Promise<TItem | null> {
    const { Item } = await dynamoClient.send(
      new GetCommand({
        TableName: this.config.mainTableName,
        Key,
        ConsistentRead: consistent,
      }),
    );
    const item = Item as TItem | undefined;

    if (!item || (item.expiresAt && item.expiresAt < nowInSeconds())) {
      return null;
    }

    return item;
  }
}

function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
