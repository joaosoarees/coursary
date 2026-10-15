import { describe, expect, test } from 'vitest';

import { Account } from '@application/entities/Account';
import { Course } from '@application/entities/Course';
import { Lesson } from '@application/entities/Lesson';
import { Module } from '@application/entities/Module';
import { Conflict } from '@application/errors/Conflict';
import { LessonNotFound } from '@application/errors/LessonNotFound';
import { DynamoUnitOfWork } from '@infra/database/dynamo/DynamoUnitOfWork';
import { CourseItem } from '@infra/database/dynamo/items/CourseItem';
import { DynamoCourseOutlineQuery } from '@infra/database/dynamo/queries/DynamoCourseOutlineQuery';
import { DynamoCourseRepository } from '@infra/database/dynamo/repositories/DynamoCourseRepository';
import { DynamoLessonRepository } from '@infra/database/dynamo/repositories/DynamoLessonRepository';
import { DynamoModuleRepository } from '@infra/database/dynamo/repositories/DynamoModuleRepository';
import { AppConfig } from '@shared/config/AppConfig';

const config = new AppConfig();
const courses = new DynamoCourseRepository(config);
const modules = new DynamoModuleRepository(config);
const lessons = new DynamoLessonRepository(config);
const outline = new DynamoCourseOutlineQuery(config);
const instructor = Account.create({ name: 'Ana', email: 'ana@example.com' });

const commit = async (...operations: Parameters<DynamoUnitOfWork['add']>) => {
  const unit = new DynamoUnitOfWork();
  unit.add(...operations);
  await unit.commit();
};

const courseWithOneLesson = async () => {
  const course = Course.create({ instructor, title: 'T', description: '' });
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
    body: '# Body',
    durationMinutes: 5,
    position: 0,
  });
  await commit(
    modules.createOperation(module),
    ...lessons.createOperations(lesson),
    courses.addLessonsOperation(course, 1),
  );

  return { course, module, lesson };
};

describe('outline repositories', () => {
  test('creates a module and a lesson and counts the lesson on the course', async () => {
    const { course, module, lesson } = await courseWithOneLesson();

    expect(await outline.execute(course.id)).toEqual({
      modules: [
        {
          id: module.id,
          title: 'M1',
          position: 0,
          lessons: [
            { id: lesson.id, title: 'L1', durationMinutes: 5, position: 0 },
          ],
        },
      ],
    });
    expect((await courses.findById(course.id))?.lessonCount).toBe(1);
    expect(
      (await lessons.findById(course.id, module.id, lesson.id))?.body,
    ).toBe('# Body');
  });

  test('moves a lesson to another module', async () => {
    const { course, module, lesson } = await courseWithOneLesson();
    const second = Module.create({
      courseId: course.id,
      title: 'M2',
      position: 1,
    });
    await commit(modules.createOperation(second));

    lesson.moduleId = second.id;
    await commit(...lessons.moveOperations(lesson, module.id));

    const { modules: read } = await outline.execute(course.id);
    expect(read.map((m) => m.lessons.map((l) => l.id))).toEqual([
      [],
      [lesson.id],
    ]);
    expect(
      (await lessons.findById(course.id, second.id, lesson.id))?.body,
    ).toBe('# Body');
  });

  test('deletes a lesson with its content and takes it off the count', async () => {
    const { course, module, lesson } = await courseWithOneLesson();

    await commit(
      ...lessons.deleteOperations(lesson),
      courses.addLessonsOperation(course, -1),
    );

    expect(await lessons.findById(course.id, module.id, lesson.id)).toBeNull();
    expect((await courses.findById(course.id))?.lessonCount).toBe(0);
    await expect(
      commit(...lessons.deleteOperations(lesson)),
    ).rejects.toBeInstanceOf(LessonNotFound);
  });

  test('refuses the whole change when the course status moved', async () => {
    const { course, module } = await courseWithOneLesson();
    const stale = CourseItem.toEntity({
      ...CourseItem.fromEntity(course).toItem(),
      status: 'PUBLISHED',
    });
    module.title = 'Renamed';

    await expect(
      commit(
        modules.renameOperation(module),
        courses.statusUnchangedOperation(stale),
      ),
    ).rejects.toBeInstanceOf(Conflict);
    expect((await modules.findById(course.id, module.id))?.title).toBe('M1');
  });
});
