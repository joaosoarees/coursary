import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { describe, expect, it } from 'vitest';

import { Account } from '@application/entities/account/Account';
import { Course } from '@application/entities/course/Course';
import {
  CourseArchived,
  CourseEmpty,
  CourseNotFound,
  CourseNotPublished,
} from '@application/errors/course';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { DynamoCourseRepository } from '@infra/database/dynamo/repositories/course/DynamoCourseRepository';
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
  it('should create a course and find it by id', async () => {
    const course = await newCourse();

    await expect(repository.findById(course.id)).resolves.toEqual(course);
  });

  it('should update only the fields given and return the whole course', async () => {
    const course = await newCourse();

    const updated = await repository.update(course.id, { title: 'Streams' });

    expect(updated).toMatchObject({
      id: course.id,
      title: 'Streams',
      description: 'Keys',
    });
  });

  it('should refuse to change an archived course', async () => {
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

  it('should refuse to change a course that does not exist', async () => {
    const missing = Course.create({ instructor, title: 'T', description: '' });

    await expect(
      repository.update(missing.id, { title: 'X' }),
    ).rejects.toBeInstanceOf(CourseNotFound);
  });

  it('should copy a new instructor name into every course of the instructor only', async () => {
    const ana = Account.create({ name: 'Ana', email: 'a@example.com' });
    const bia = Account.create({ name: 'Bia', email: 'b@example.com' });
    const anaCourses = [
      Course.create({ instructor: ana, title: 'A1', description: '' }),
      Course.create({ instructor: ana, title: 'A2', description: '' }),
    ];
    const biaCourse = Course.create({
      instructor: bia,
      title: 'B1',
      description: '',
    });
    for (const course of [...anaCourses, biaCourse]) {
      await repository.create(course);
    }

    await repository.updateInstructorName(ana.id, 'Ana Souza');

    for (const course of anaCourses) {
      expect((await repository.findById(course.id))?.instructorName).toBe(
        'Ana Souza',
      );
    }
    expect((await repository.findById(biaCourse.id))?.instructorName).toBe(
      'Bia',
    );
  });

  const catalogEntry = async (course: Course) => {
    const { Item } = await dynamoClient.send(
      new GetCommand({
        TableName: config.mainTableName,
        Key: { PK: `COURSE#${course.id}`, SK: `COURSE#${course.id}` },
        ConsistentRead: true,
      }),
    );

    return Item?.GSI2PK as string | undefined;
  };

  it('should publish a course with lessons into the catalog and archive it out', async () => {
    const course = await newCourse();
    await dynamoClient.send(
      new UpdateCommand({
        TableName: config.mainTableName,
        Key: { PK: `COURSE#${course.id}`, SK: `COURSE#${course.id}` },
        UpdateExpression: 'SET lessonCount = :one',
        ExpressionAttributeValues: { ':one': 1 },
      }),
    );

    const published = await repository.publish(course.id, new Date());
    expect(published.status).toBe('PUBLISHED');
    expect(await catalogEntry(course)).toBe('CATALOG');

    const archived = await repository.archive(course.id);
    expect(archived.status).toBe('ARCHIVED');
    expect(await catalogEntry(course)).toBeUndefined();
  });

  it('should refuse to publish a course without lessons, and to archive a draft', async () => {
    const course = await newCourse();

    await expect(
      repository.publish(course.id, new Date()),
    ).rejects.toBeInstanceOf(CourseEmpty);
    await expect(repository.archive(course.id)).rejects.toBeInstanceOf(
      CourseNotPublished,
    );
    expect(await catalogEntry(course)).toBeUndefined();
  });
});
