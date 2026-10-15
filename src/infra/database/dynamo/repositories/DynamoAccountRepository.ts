import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';
import { TransactWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

import type { Account } from '@application/entities/Account';
import { EmailInUse } from '@application/errors/EmailInUse';
import { AccountRepository } from '@application/repositories/AccountRepository';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { AccountItem } from '@infra/database/dynamo/items/AccountItem';
import { EmailClaimItem } from '@infra/database/dynamo/items/EmailClaimItem';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

@Injectable()
export class DynamoAccountRepository extends AccountRepository {
  constructor(private readonly config: AppConfig) {
    super();
  }

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
                ConditionExpression: 'attribute_not_exists(PK)',
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
}
