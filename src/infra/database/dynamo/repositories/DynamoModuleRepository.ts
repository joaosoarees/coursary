import { GetCommand } from '@aws-sdk/lib-dynamodb';

import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import type { Course } from '@application/entities/Course';
import type { Module } from '@application/entities/Module';
import { ModuleNotFound } from '@application/errors/outline';
import type { ModuleRepository } from '@application/repositories/ModuleRepository';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { DynamoUnitOfWork } from '@infra/database/dynamo/DynamoUnitOfWork';
import { ModuleItem } from '@infra/database/dynamo/items/ModuleItem';
import type { AppConfig } from '@shared/config/AppConfig';

export class DynamoModuleRepository implements ModuleRepository {
  constructor(private readonly config: AppConfig) {}

  async findById(courseId: Course.Id, id: Module.Id): Promise<Module | null> {
    const command = new GetCommand({
      TableName: this.config.mainTableName,
      Key: { PK: ModuleItem.getPK(courseId), SK: ModuleItem.getSK(id) },
    });

    const { Item } = await dynamoClient.send(command);

    return Item ? ModuleItem.toEntity(Item as ModuleItem.ItemType) : null;
  }

  createOperation(module: Module): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation({
      Put: {
        TableName: this.config.mainTableName,
        Item: ModuleItem.fromEntity(module).toItem(),
        ConditionExpression: 'attribute_not_exists(PK)',
      },
    });
  }

  renameOperation(module: Module): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation(
      {
        Update: {
          TableName: this.config.mainTableName,
          Key: this.keyOf(module),
          UpdateExpression: 'SET title = :title',
          ConditionExpression: 'attribute_exists(PK)',
          ExpressionAttributeValues: { ':title': module.title },
        },
      },
      () => new ModuleNotFound(),
    );
  }

  deleteOperation(module: Module): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation(
      {
        Delete: {
          TableName: this.config.mainTableName,
          Key: this.keyOf(module),
          ConditionExpression: 'attribute_exists(PK)',
        },
      },
      () => new ModuleNotFound(),
    );
  }

  repositionOperation(module: Module): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation({
      Update: {
        TableName: this.config.mainTableName,
        Key: this.keyOf(module),
        UpdateExpression: 'SET #position = :position',
        ConditionExpression: 'attribute_exists(PK)',
        ExpressionAttributeNames: { '#position': 'position' },
        ExpressionAttributeValues: { ':position': module.position },
      },
    });
  }

  private keyOf(module: Module) {
    return {
      PK: ModuleItem.getPK(module.courseId),
      SK: ModuleItem.getSK(module.id),
    };
  }
}
