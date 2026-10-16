import { beforeEach, describe, expect, it } from 'vitest';

import { courseWorld } from '@tests/support/courseWorld';

import { LessonNotFound } from '@application/errors/outline';

let world: Awaited<ReturnType<typeof courseWorld>>;

beforeEach(async () => {
  world = await courseWorld();
});

const commit = async (
  operations: Parameters<ReturnType<typeof world.unitOfWork>['add']>,
) => {
  const unit = world.unitOfWork();
  unit.add(...operations);
  await unit.commit();
};

describe('DynamoLessonRepository', () => {
  it('should create a lesson with its body and count it on the course', async () => {
    const module = await world.addModule('M1', 0);
    const lesson = await world.addLesson(module, 0);

    const { modules } = await world.outline.execute(world.course.id);
    expect(modules[0]?.lessons.map((l) => l.id)).toEqual([lesson.id]);
    expect((await world.storedCourse())?.lessonCount).toBe(1);
    expect(
      await world.lessons.findById(world.course.id, module.id, lesson.id),
    ).toMatchObject({ title: 'L0', body: '' });
  });

  it('should move a lesson to another module, body included', async () => {
    const from = await world.addModule('M1', 0);
    const to = await world.addModule('M2', 1);
    const lesson = await world.addLesson(from, 0);

    lesson.moduleId = to.id;
    await commit(world.lessons.moveOperations(lesson, from.id));

    expect(
      await world.lessons.findById(world.course.id, from.id, lesson.id),
    ).toBeNull();
    expect(
      await world.lessons.findById(world.course.id, to.id, lesson.id),
    ).not.toBeNull();
  });

  it('should delete a lesson with its content, and refuse one that is gone', async () => {
    const module = await world.addModule('M1', 0);
    const lesson = await world.addLesson(module, 0);

    await commit([
      ...world.lessons.deleteOperations(lesson),
      world.courses.addLessonsOperation(world.course, -1),
    ]);

    expect((await world.storedCourse())?.lessonCount).toBe(0);
    await expect(
      commit(world.lessons.deleteOperations(lesson)),
    ).rejects.toBeInstanceOf(LessonNotFound);
  });

  it('should find the content of a lesson only within its course', async () => {
    const module = await world.addModule('M1', 0);
    const lesson = await world.addLesson(module, 0);
    const other = await courseWorld();

    await expect(
      world.lessons.findContent(world.course.id, lesson.id),
    ).resolves.toEqual({
      lessonId: lesson.id,
      courseId: world.course.id,
      body: '',
    });
    await expect(
      world.lessons.findContent(other.course.id, lesson.id),
    ).resolves.toBeNull();
  });
});
