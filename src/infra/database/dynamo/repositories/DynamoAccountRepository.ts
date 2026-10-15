import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';
import {
  GetCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import {
  Account,
  accountRoles,
  accountStatuses,
} from '@application/entities/Account';
import type { RoleChange } from '@application/entities/RoleChange';
import { EmailInUse } from '@application/errors/EmailInUse';
import { Forbidden } from '@application/errors/Forbidden';
import { RoleChangeConflict } from '@application/errors/RoleChangeConflict';
import type { AccountRepository } from '@application/repositories/AccountRepository';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { AccountItem } from '@infra/database/dynamo/items/AccountItem';
import { EmailClaimItem } from '@infra/database/dynamo/items/EmailClaimItem';
import { RoleChangeItem } from '@infra/database/dynamo/items/RoleChangeItem';
import { AppConfig } from '@shared/config/AppConfig';

export class DynamoAccountRepository implements AccountRepository {
  constructor(private readonly config: AppConfig) {}

  async create(account: Account): Promise<void> {
    const TableName = this.config.mainTableName;
    const accountItem = AccountItem.fromEntity(account);
    const emailClaimItem = EmailClaimItem.fromEntity(account);

    try {
      const command = new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName,
              Item: accountItem.toItem(),
              ConditionExpression: 'attribute_not_exists(PK)',
            },
          },
          {
            Put: {
              TableName,
              Item: emailClaimItem.toItem(),
              ConditionExpression:
                'attribute_not_exists(PK) OR expiresAt < :now',
              ExpressionAttributeValues: {
                ':now': DynamoAccountRepository.nowInSeconds(),
              },
            },
          },
        ],
      });

      await dynamoClient.send(command);
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

    const command = new TransactWriteCommand({
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
    });

    await dynamoClient.send(command);
  }

  async saveExternalId(account: Account): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.config.mainTableName,
      Key: {
        PK: AccountItem.getPK(account.id),
        SK: AccountItem.getSK(account.id),
      },
      UpdateExpression: 'SET externalId = :externalId',
      ConditionExpression: 'attribute_exists(PK)',
      ExpressionAttributeValues: { ':externalId': account.externalId },
    });

    await dynamoClient.send(command);
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
    const normalized = Account.normalizeEmail(email);
    const claim = await this.getLive<EmailClaimItem.ItemType>({
      PK: EmailClaimItem.getPK(normalized),
      SK: EmailClaimItem.getSK(normalized),
    });

    return claim ? this.findById(claim.accountId) : null;
  }

  async activate(account: Account): Promise<void> {
    const TableName = this.config.mainTableName;

    const command = new TransactWriteCommand({
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
    });

    await dynamoClient.send(command);
  }

  async updateName(id: string, name: string): Promise<Account> {
    const command = new UpdateCommand({
      TableName: this.config.mainTableName,
      Key: { PK: AccountItem.getPK(id), SK: AccountItem.getSK(id) },
      UpdateExpression: 'SET #name = :name',
      ConditionExpression: 'attribute_exists(PK)',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: { ':name': name },
      ReturnValues: 'ALL_NEW',
    });

    const { Attributes } = await dynamoClient.send(command);

    return AccountItem.toEntity(Attributes as AccountItem.ItemType);
  }

  async changeRole(
    roleChange: RoleChange,
    { adminCallerId }: AccountRepository.ChangeRoleOptions = {},
  ): Promise<void> {
    const TableName = this.config.mainTableName;
    const roleChangeItem = RoleChangeItem.fromEntity(roleChange);
    const callerCheck = adminCallerId
      ? [
          {
            ConditionCheck: {
              TableName,
              Key: {
                PK: AccountItem.getPK(adminCallerId),
                SK: AccountItem.getSK(adminCallerId),
              },
              ConditionExpression: '#role = :admin AND #status = :active',
              ExpressionAttributeNames: {
                '#role': 'role',
                '#status': 'status',
              },
              ExpressionAttributeValues: {
                ':admin': accountRoles.Admin,
                ':active': accountStatuses.Active,
              },
            },
          },
        ]
      : [];

    const command = new TransactWriteCommand({
      TransactItems: [
        {
          Update: {
            TableName,
            Key: {
              PK: AccountItem.getPK(roleChange.accountId),
              SK: AccountItem.getSK(roleChange.accountId),
            },
            UpdateExpression: 'SET #role = :toRole, GSI1PK = :gsi1pk',
            ConditionExpression: '#status = :active AND #role = :fromRole',
            ExpressionAttributeNames: {
              '#role': 'role',
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':toRole': roleChange.toRole,
              ':fromRole': roleChange.fromRole,
              ':gsi1pk': AccountItem.getGSI1PK(roleChange.toRole),
              ':active': accountStatuses.Active,
            },
          },
        },
        {
          Put: {
            TableName,
            Item: roleChangeItem.toItem(),
            ConditionExpression: 'attribute_not_exists(PK)',
          },
        },
        ...callerCheck,
      ],
    });

    try {
      await dynamoClient.send(command);
    } catch (error) {
      if (!(error instanceof TransactionCanceledException)) {
        throw error;
      }

      const callerFailed =
        error.CancellationReasons?.[2]?.Code === 'ConditionalCheckFailed';

      throw callerFailed ? new Forbidden() : new RoleChangeConflict();
    }
  }

  private async getLive<TItem extends { expiresAt?: number }>(
    Key: Record<string, string>,
    consistent = true,
  ): Promise<TItem | null> {
    const getCommand = new GetCommand({
      TableName: this.config.mainTableName,
      Key,
      ConsistentRead: consistent,
    });

    const { Item } = await dynamoClient.send(getCommand);
    const item = Item as TItem | undefined;

    if (
      !item ||
      (item.expiresAt &&
        item.expiresAt < DynamoAccountRepository.nowInSeconds())
    ) {
      return null;
    }

    return item;
  }

  private static nowInSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }
}
