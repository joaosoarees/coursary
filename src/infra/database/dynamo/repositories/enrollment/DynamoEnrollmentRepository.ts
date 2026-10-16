import { GetCommand } from '@aws-sdk/lib-dynamodb';

import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import type { Account } from '@application/entities/account/Account';
import type { Course } from '@application/entities/course/Course';
import {
  type Enrollment,
  enrollmentStatuses,
} from '@application/entities/enrollment/Enrollment';
import type { EnrollmentRepository } from '@application/repositories/enrollment/EnrollmentRepository';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { DynamoUnitOfWork } from '@infra/database/dynamo/DynamoUnitOfWork';
import { EnrollmentItem } from '@infra/database/dynamo/items/enrollment/EnrollmentItem';
import type { AppConfig } from '@shared/config/AppConfig';

export class DynamoEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly config: AppConfig) {}

  async find(
    accountId: Account.Id,
    courseId: Course.Id,
    { consistent = false }: EnrollmentRepository.ReadOptions = {},
  ): Promise<Enrollment | null> {
    const command = new GetCommand({
      TableName: this.config.mainTableName,
      Key: {
        PK: EnrollmentItem.getPK(accountId),
        SK: EnrollmentItem.getSK(courseId),
      },
      ConsistentRead: consistent,
    });

    const { Item } = await dynamoClient.send(command);

    return Item
      ? EnrollmentItem.toEntity(Item as EnrollmentItem.ItemType)
      : null;
  }

  createOperation(enrollment: Enrollment): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation({
      Put: {
        TableName: this.config.mainTableName,
        Item: EnrollmentItem.fromEntity(enrollment).toItem(),
        ConditionExpression: 'attribute_not_exists(PK)',
      },
    });
  }

  reactivateOperation(enrollment: Enrollment): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation({
      Update: {
        TableName: this.config.mainTableName,
        Key: this.keyOf(enrollment),
        UpdateExpression:
          'SET #status = :active, GSI1PK = :gsi1pk, GSI1SK = :gsi1sk',
        ConditionExpression: '#status = :cancelled',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':active': enrollmentStatuses.Active,
          ':cancelled': enrollmentStatuses.Cancelled,
          ':gsi1pk': EnrollmentItem.getGSI1PK(enrollment.courseId),
          ':gsi1sk': EnrollmentItem.getGSI1SK(
            enrollment.enrolledAt.toISOString(),
            enrollment.accountId,
          ),
        },
      },
    });
  }

  cancelOperation(enrollment: Enrollment): UnitOfWork.Operation {
    return DynamoUnitOfWork.operation({
      Update: {
        TableName: this.config.mainTableName,
        Key: this.keyOf(enrollment),
        UpdateExpression: 'SET #status = :cancelled REMOVE GSI1PK, GSI1SK',
        ConditionExpression: '#status = :active',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':active': enrollmentStatuses.Active,
          ':cancelled': enrollmentStatuses.Cancelled,
        },
      },
    });
  }

  private keyOf(enrollment: Enrollment) {
    return {
      PK: EnrollmentItem.getPK(enrollment.accountId),
      SK: EnrollmentItem.getSK(enrollment.courseId),
    };
  }
}
