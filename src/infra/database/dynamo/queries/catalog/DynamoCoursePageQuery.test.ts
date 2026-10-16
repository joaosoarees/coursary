import { describe, expect, test } from 'vitest';

import { Account } from '@application/entities/account/Account';
import { Course } from '@application/entities/course/Course';
import { Lesson } from '@application/entities/outline/Lesson';
import { Module } from '@application/entities/outline/Module';
import { DynamoUnitOfWork } from '@infra/database/dynamo/DynamoUnitOfWork';
import { DynamoCoursePageQuery } from '@infra/database/dynamo/queries/catalog/DynamoCoursePageQuery';
import { DynamoCourseRepository } from '@infra/database/dynamo/repositories/course/DynamoCourseRepository';
import { DynamoLessonRepository } from '@infra/database/dynamo/repositories/outline/DynamoLessonRepository';
import { DynamoModuleRepository } from '@infra/database/dynamo/repositories/outline/DynamoModuleRepository';
import { AppConfig } from '@shared/config/AppConfig';

const config = new AppConfig();
const courses = new DynamoCourseRepository(config);
const modules = new DynamoModuleRepository(config);
const lessons = new DynamoLessonRepository(config);
const coursePage = new DynamoCoursePageQuery(config);
const instructor = Account.create({ name: 'Ana', email: 'ana@example.com' });

const courseWithLesson = async (title: string) => {
  const course = Course.create({ instructor, title, description: 'About' });
  await courses.create(course);
  const module = Module.create({
    courseId: course.id,
    title: 'M1',
    position: 0,
  });
  const lesson = Lesson.create({
    courseId: course.id,
    moduleId: module.id,
    title: 'L1',
    body: '# Secret body',
    durationMinutes: 5,
    position: 0,
  });
  const unit = new DynamoUnitOfWork();
  unit.add(
    modules.createOperation(module),
    ...lessons.createOperations(lesson),
    courses.addLessonsOperation(course, 1),
  );
  await unit.commit();

  return { course, module, lesson };
};

describe('DynamoCoursePageQuery', () => {
  test('the course page shows a published course and its outline, without bodies', async () => {
    const { course, module, lesson } = await courseWithLesson('Public');
    expect(await coursePage.execute(course.id)).toBeNull();

    await courses.publish(course.id, new Date());
    const page = await coursePage.execute(course.id);

    expect(page).toMatchObject({
      id: course.id,
      title: 'Public',
      lessonCount: 1,
      modules: [
        {
          id: module.id,
          lessons: [{ id: lesson.id, title: 'L1', durationMinutes: 5 }],
        },
      ],
    });
    expect(JSON.stringify(page)).not.toContain('Secret body');
  });
});
