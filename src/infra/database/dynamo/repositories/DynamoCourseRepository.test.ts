import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, test } from 'vitest';

import { Account } from '@application/entities/Account';
import { Course } from '@application/entities/Course';
import { CourseArchived } from '@application/errors/CourseArchived';
import { CourseNotFound } from '@application/errors/CourseNotFound';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { DynamoCourseRepository } from '@infra/database/dynamo/repositories/DynamoCourseRepository';
import { AppConfig } from '@shared/config/AppConfig';

const config = new AppConfig();
const repository = new DynamoCourseRepository(config);
const instructor = Account.create({ name: 'Ana', email: 'ana@example.com' });

const newCourse = async () => {
  const course = Course.create({
    instructor,
    title: 'DynamoDB',
    description: 'Keys',
  });
  await repository.create(course);

  return course;
};

describe('DynamoCourseRepository', () => {
  test('creates a course and finds it by id', async () => {
    const course = await newCourse();

    await expect(repository.findById(course.id)).resolves.toEqual(course);
  });

  test('updates only the fields given and returns the whole course', async () => {
    const course = await newCourse();

    const updated = await repository.update(course.id, { title: 'Streams' });

    expect(updated).toMatchObject({
      id: course.id,
      title: 'Streams',
      description: 'Keys',
    });
  });

  test('refuses to change an archived course', async () => {
    const course = await newCourse();
    await dynamoClient.send(
      new UpdateCommand({
        TableName: config.mainTableName,
        Key: { PK: `COURSE#${course.id}`, SK: `COURSE#${course.id}` },
        UpdateExpression: 'SET #status = :archived',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':archived': 'ARCHIVED' },
      }),
    );

    await expect(
      repository.update(course.id, { title: 'X' }),
    ).rejects.toBeInstanceOf(CourseArchived);
  });

  test('refuses to change a course that does not exist', async () => {
    const missing = Course.create({ instructor, title: 'T', description: '' });

    await expect(
      repository.update(missing.id, { title: 'X' }),
    ).rejects.toBeInstanceOf(CourseNotFound);
  });
});
