import { beforeEach, describe, expect, it } from 'vitest';

import { outlineWorld } from '@tests/outlineWorld';

import { Lesson } from '@application/entities/Lesson';
import { Module } from '@application/entities/Module';
import { CourseArchived } from '@application/errors/CourseArchived';
import { CourseNotFound } from '@application/errors/CourseNotFound';
import { CoursePublished } from '@application/errors/CoursePublished';
import { ModuleNotEmpty } from '@application/errors/ModuleNotEmpty';
import { CreateModuleUseCase } from '@application/usecases/outline/CreateModuleUseCase';
import { DeleteModuleUseCase } from '@application/usecases/outline/DeleteModuleUseCase';
import { UpdateModuleUseCase } from '@application/usecases/outline/UpdateModuleUseCase';

let world: Awaited<ReturnType<typeof outlineWorld>>;
let create: CreateModuleUseCase;
let update: UpdateModuleUseCase;
let remove: DeleteModuleUseCase;

beforeEach(async () => {
  world = await outlineWorld();
  const { courses, modules, outline, unitOfWork } = world;
  create = new CreateModuleUseCase(courses, modules, outline, unitOfWork);
  update = new UpdateModuleUseCase(courses, modules, unitOfWork);
  remove = new DeleteModuleUseCase(courses, modules, outline, unitOfWork);
});

describe('module use cases', () => {
  it('should put each new module at the end', async () => {
    const first = await create.execute({
      ...world.as(world.owner),
      title: 'A1 ',
    });
    const second = await create.execute({
      ...world.as(world.owner),
      title: 'B22',
    });

    expect([first.position, second.position]).toEqual([0, 1]);
    expect(first.title).toBe('A1');
  });

  it('should let an admin add a module and hide the draft from another instructor', async () => {
    await expect(
      create.execute({ ...world.as(world.admin), title: 'Adm' }),
    ).resolves.toMatchObject({ title: 'Adm' });
    await expect(
      create.execute({ ...world.as(world.other), title: 'No' }),
    ).rejects.toBeInstanceOf(CourseNotFound);
  });

  it('should rename a module', async () => {
    const { id } = await create.execute({
      ...world.as(world.owner),
      title: 'Old',
    });

    await update.execute({
      ...world.as(world.owner),
      moduleId: Module.toId(id),
      title: 'New',
    });

    expect(world.modules.modules.get(Module.toId(id))?.title).toBe('New');
  });

  it('should refuse any change to an archived course', async () => {
    world.course.status = 'ARCHIVED';

    await expect(
      create.execute({ ...world.as(world.owner), title: 'Nope' }),
    ).rejects.toBeInstanceOf(CourseArchived);
  });

  it('should delete an empty module of a draft only', async () => {
    const { id } = await create.execute({
      ...world.as(world.owner),
      title: 'M1',
    });
    const moduleId = Module.toId(id);
    world.course.status = 'PUBLISHED';

    await expect(
      remove.execute({ ...world.as(world.owner), moduleId }),
    ).rejects.toBeInstanceOf(CoursePublished);

    world.course.status = 'DRAFT';
    await remove.execute({ ...world.as(world.owner), moduleId });
    expect(world.modules.modules.has(moduleId)).toBe(false);
  });

  it('should refuse to delete a module with lessons', async () => {
    const { id } = await create.execute({
      ...world.as(world.owner),
      title: 'M1',
    });
    const moduleId = Module.toId(id);
    const lesson = Lesson.create({
      courseId: world.course.id,
      moduleId,
      title: 'L1',
      body: '',
      durationMinutes: 5,
      position: 0,
    });
    world.lessons.lessons.set(lesson.id, lesson);

    await expect(
      remove.execute({ ...world.as(world.owner), moduleId }),
    ).rejects.toBeInstanceOf(ModuleNotEmpty);
  });
});
