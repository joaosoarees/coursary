import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import type { LessonProgress } from '@application/entities/enrollment/LessonProgress';
import { AlreadyCompleted } from '@application/errors/enrollment';
import type { ProgressRepository } from '@application/repositories/enrollment/ProgressRepository';
import { DynamoUnitOfWork } from '@infra/database/dynamo/DynamoUnitOfWork';
import { LessonProgressItem } from '@infra/database/dynamo/items/enrollment/LessonProgressItem';
import type { AppConfig } from '@shared/config/AppConfig';

export class DynamoProgressRepository implements ProgressRepository {
  constructor(private readonly config: AppConfig) {}

  completeOperation(progress: LessonProgress): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation(
      {
        Put: {
          TableName: this.config.mainTableName,
          Item: LessonProgressItem.fromEntity(progress).toItem(),
          ConditionExpression: 'attribute_not_exists(PK)',
        },
      },
      () => new AlreadyCompleted(),
    );
  }
}
