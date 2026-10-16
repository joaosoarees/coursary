import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

import { Account, accountRoles } from '@application/entities/account/Account';
import { Course } from '@application/entities/course/Course';
import { Lesson } from '@application/entities/outline/Lesson';
import { Module } from '@application/entities/outline/Module';
import { dynamoClient } from '@infra/clients/dynamoClient';
import { DynamoUnitOfWork } from '@infra/database/dynamo/DynamoUnitOfWork';
import { DynamoCourseOutlineQuery } from '@infra/database/dynamo/queries/outline/DynamoCourseOutlineQuery';
import { DynamoAccountRepository } from '@infra/database/dynamo/repositories/account/DynamoAccountRepository';
import { DynamoCourseRepository } from '@infra/database/dynamo/repositories/course/DynamoCourseRepository';
import { DynamoLessonRepository } from '@infra/database/dynamo/repositories/outline/DynamoLessonRepository';
import { DynamoModuleRepository } from '@infra/database/dynamo/repositories/outline/DynamoModuleRepository';
import { AppConfig } from '@shared/config/AppConfig';

const config = new AppConfig();

const account = (name: string, role: Account.Role) => {
  const created = Account.create({
    name,
    email: `${name}-${crypto.randomUUID()}@example.com`,
  });
  created.activate();
  created.role = role;

  return created;
};

// A draft course in DynamoDB Local, its owner, another instructor and an admin.
export async function courseWorld() {
  const accounts = new DynamoAccountRepository(config);
  const courses = new DynamoCourseRepository(config);
  const modules = new DynamoModuleRepository(config);
  const lessons = new DynamoLessonRepository(config);
  const outline = new DynamoCourseOutlineQuery(config);
  const unitOfWork = () => new DynamoUnitOfWork();
  const owner = account('ana', accountRoles.Instructor);
  const other = account('bia', accountRoles.Instructor);
  const admin = account('caio', accountRoles.Admin);
  const course = Course.create({
    instructor: owner,
    title: 'T',
    description: '',
  });
  await courses.create(course);

  const as = (caller: Account) => ({
    callerId: caller.id,
    callerRole: caller.role,
    courseId: course.id,
  });

  const setCourse = async (fields: {
    status?: Course.Status;
    lessonCount?: number;
  }) => {
    const entries = Object.entries(fields);
    await dynamoClient.send(
      new UpdateCommand({
        TableName: config.mainTableName,
        Key: { PK: `COURSE#${course.id}`, SK: `COURSE#${course.id}` },
        UpdateExpression: `SET ${entries.map(([k]) => `#${k} = :${k}`).join(', ')}`,
        ExpressionAttributeNames: Object.fromEntries(
          entries.map(([k]) => [`#${k}`, k]),
        ),
        ExpressionAttributeValues: Object.fromEntries(
          entries.map(([k, v]) => [`:${k}`, v]),
        ),
      }),
    );
  };

  const addModule = async (title: string, position: number) => {
    const module = Module.create({ courseId: course.id, title, position });
    const unit = unitOfWork();
    unit.add(modules.createOperation(module));
    await unit.commit();

    return module;
  };

  const addLesson = async (module: Module, position: number) => {
    const lesson = Lesson.create({
      courseId: course.id,
      moduleId: module.id,
      title: `L${String(position)}`,
      body: '',
      durationMinutes: 5,
      position,
    });
    const unit = unitOfWork();
    unit.add(
      ...lessons.createOperations(lesson),
      courses.addLessonsOperation(course, 1),
    );
    await unit.commit();

    return lesson;
  };

  const storedCourse = async () => courses.findById(course.id);

  return {
    accounts,
    courses,
    modules,
    lessons,
    outline,
    unitOfWork,
    owner,
    other,
    admin,
    course,
    as,
    setCourse,
    addModule,
    addLesson,
    storedCourse,
  };
}
