import { beforeEach, describe, expect, it } from 'vitest';

import { outlineWorld } from '@tests/outlineWorld';

import { Lesson } from '@application/entities/Lesson';
import { Module } from '@application/entities/Module';
import { CourseNotFound } from '@application/errors/CourseNotFound';
import { CoursePublished } from '@application/errors/CoursePublished';
import { LessonNotFound } from '@application/errors/LessonNotFound';
import { ModuleNotFound } from '@application/errors/ModuleNotFound';
import { CreateLessonUseCase } from '@application/usecases/outline/CreateLessonUseCase';
import { DeleteLessonUseCase } from '@application/usecases/outline/DeleteLessonUseCase';
import { UpdateLessonUseCase } from '@application/usecases/outline/UpdateLessonUseCase';

let world: Awaited<ReturnType<typeof outlineWorld>>;
let module: Module;
let create: CreateLessonUseCase;
let update: UpdateLessonUseCase;
let remove: DeleteLessonUseCase;

const content = { title: 'Keys', body: '# Keys', durationMinutes: 10 };

beforeEach(async () => {
  world = await outlineWorld();
  const { courses, lessons, outline, unitOfWork } = world;
  module = Module.create({
    courseId: world.course.id,
    title: 'M1',
    position: 0,
  });
  world.modules.modules.set(module.id, module);
  create = new CreateLessonUseCase(courses, lessons, outline, unitOfWork);
  update = new UpdateLessonUseCase(courses, lessons, unitOfWork);
  remove = new DeleteLessonUseCase(courses, lessons, unitOfWork);
});

const add = () =>
  create.execute({ ...world.as(world.owner), moduleId: module.id, ...content });

describe('lesson use cases', () => {
  it('should add lessons at the end of the module and count them on the course', async () => {
    const first = await add();
    const second = await add();

    expect([first.position, second.position]).toEqual([0, 1]);
    expect(world.course.lessonCount).toBe(2);
  });

  it('should refuse a module that is not in the course', async () => {
    await expect(
      create.execute({
        ...world.as(world.owner),
        moduleId: Module.create({
          courseId: world.course.id,
          title: 'X',
          position: 0,
        }).id,
        ...content,
      }),
    ).rejects.toBeInstanceOf(ModuleNotFound);
  });

  it('should hide the draft from another instructor', async () => {
    await expect(
      create.execute({
        ...world.as(world.other),
        moduleId: module.id,
        ...content,
      }),
    ).rejects.toBeInstanceOf(CourseNotFound);
  });

  it('should change only the fields given', async () => {
    const { id } = await add();

    const changed = await update.execute({
      ...world.as(world.admin),
      moduleId: module.id,
      lessonId: Lesson.toId(id),
      changes: { durationMinutes: 20 },
    });

    expect(changed).toMatchObject({
      title: 'Keys',
      body: '# Keys',
      durationMinutes: 20,
    });
  });

  it('should delete a lesson of a draft and take it off the count', async () => {
    const { id } = await add();
    const lessonId = Lesson.toId(id);

    await remove.execute({
      ...world.as(world.owner),
      moduleId: module.id,
      lessonId,
    });

    expect(world.course.lessonCount).toBe(0);
    await expect(
      remove.execute({
        ...world.as(world.owner),
        moduleId: module.id,
        lessonId,
      }),
    ).rejects.toBeInstanceOf(LessonNotFound);
  });

  it('should keep the lessons of a published course', async () => {
    const { id } = await add();
    world.course.status = 'PUBLISHED';

    await expect(
      remove.execute({
        ...world.as(world.owner),
        moduleId: module.id,
        lessonId: Lesson.toId(id),
      }),
    ).rejects.toBeInstanceOf(CoursePublished);
  });
});
