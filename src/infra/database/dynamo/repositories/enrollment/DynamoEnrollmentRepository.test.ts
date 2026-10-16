import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, test } from 'vitest';

import { Account } from '@application/entities/account/Account';
import { Course } from '@application/entities/course/Course';
import { Enrollment } from '@application/entities/enrollment/Enrollment';
import { Conflict } from '@application/errors/common';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { DynamoUnitOfWork } from '@infra/database/dynamo/DynamoUnitOfWork';
import { DynamoCourseRepository } from '@infra/database/dynamo/repositories/course/DynamoCourseRepository';
import { DynamoEnrollmentRepository } from '@infra/database/dynamo/repositories/enrollment/DynamoEnrollmentRepository';
import { AppConfig } from '@shared/config/AppConfig';

const config = new AppConfig();
const courses = new DynamoCourseRepository(config);
const enrollments = new DynamoEnrollmentRepository(config);
const instructor = Account.create({ name: 'Ana', email: 'ana@example.com' });

const commit = async (...operations: Parameters<DynamoUnitOfWork['add']>) => {
  const unit = new DynamoUnitOfWork();
  unit.add(...operations);
  await unit.commit();
};

const publishedCourse = async () => {
  const course = Course.create({ instructor, title: 'T', description: '' });
  await courses.create(course);
  await dynamoClient.send(
    new UpdateCommand({
      TableName: config.mainTableName,
      Key: { PK: `COURSE#${course.id}`, SK: `COURSE#${course.id}` },
      UpdateExpression: 'SET lessonCount = :one',
      ExpressionAttributeValues: { ':one': 1 },
    }),
  );

  return courses.publish(course.id, new Date());
};

const rawItem = async (enrollment: Enrollment) => {
  const { Item } = await dynamoClient.send(
    new GetCommand({
      TableName: config.mainTableName,
      Key: {
        PK: `ACCOUNT#${enrollment.accountId}`,
        SK: `ENROLLMENT#${enrollment.courseId}`,
      },
      ConsistentRead: true,
    }),
  );

  return Item;
};

const count = async (course: Course) =>
  (await courses.findById(course.id))?.enrollmentCount;

describe('DynamoEnrollmentRepository', () => {
  test('enrolls, cancels and enrolls again, keeping the count and the place in the list', async () => {
    const course = await publishedCourse();
    const student = Account.create({ name: 'Bia', email: 'b@example.com' });
    const enrollment = Enrollment.create({ student, course });
    const rule = { requirePublished: true };

    await commit(
      enrollments.createOperation(enrollment),
      courses.addEnrollmentsOperation(course, 1, rule),
    );
    const listedAt = (await rawItem(enrollment))?.GSI1SK as string;
    expect(await count(course)).toBe(1);

    await commit(
      enrollments.cancelOperation(enrollment),
      courses.addEnrollmentsOperation(course, -1, { requirePublished: false }),
    );
    expect((await rawItem(enrollment))?.GSI1PK).toBeUndefined();
    expect(await count(course)).toBe(0);

    await commit(
      enrollments.reactivateOperation(enrollment),
      courses.addEnrollmentsOperation(course, 1, rule),
    );
    expect((await rawItem(enrollment))?.GSI1SK).toBe(listedAt);
    expect(
      (await enrollments.find(student.id, course.id, { consistent: true }))
        ?.status,
    ).toBe('ACTIVE');
  });

  test('counts two enrollments of the same student at once only once', async () => {
    const course = await publishedCourse();
    const student = Account.create({ name: 'Bia', email: 'b@example.com' });
    const enroll = () =>
      commit(
        enrollments.createOperation(Enrollment.create({ student, course })),
        courses.addEnrollmentsOperation(course, 1, { requirePublished: true }),
      );

    const results = await Promise.allSettled([enroll(), enroll()]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await count(course)).toBe(1);
  });

  test('refuses an enrollment in a course that is not published', async () => {
    const course = Course.create({ instructor, title: 'T', description: '' });
    await courses.create(course);
    const student = Account.create({ name: 'Bia', email: 'b@example.com' });
    const enrollment = Enrollment.create({ student, course });

    await expect(
      commit(
        enrollments.createOperation(enrollment),
        courses.addEnrollmentsOperation(course, 1, { requirePublished: true }),
      ),
    ).rejects.toBeInstanceOf(Conflict);
    expect(await rawItem(enrollment)).toBeUndefined();
  });
});
