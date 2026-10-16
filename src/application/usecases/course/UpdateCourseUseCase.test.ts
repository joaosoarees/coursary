import { beforeEach, describe, expect, test } from 'vitest';

import { courseWorld } from '@tests/support/courseWorld';

import type { Account } from '@application/entities/account/Account';
import { Forbidden } from '@application/errors/common';
import { CourseArchived, CourseNotFound } from '@application/errors/course';
import { UpdateCourseUseCase } from '@application/usecases/course/UpdateCourseUseCase';

let world: Awaited<ReturnType<typeof courseWorld>>;

beforeEach(async () => {
  world = await courseWorld();
});

const update = (caller: Account) =>
  new UpdateCourseUseCase(world.courses).execute({
    ...world.as(caller),
    changes: { title: 'New title' },
  });

describe('UpdateCourseUseCase', () => {
  test('lets the owner and an admin change the course', async () => {
    await expect(update(world.owner)).resolves.toMatchObject({
      title: 'New title',
    });
    await expect(update(world.admin)).resolves.toMatchObject({
      title: 'New title',
    });
  });

  test('hides a draft of another instructor (404) and refuses a visible one (403)', async () => {
    await expect(update(world.other)).rejects.toBeInstanceOf(CourseNotFound);

    await world.setCourse({ status: 'PUBLISHED' });
    await expect(update(world.other)).rejects.toBeInstanceOf(Forbidden);
  });

  test('refuses an archived course, also to an admin', async () => {
    await world.setCourse({ status: 'ARCHIVED' });

    await expect(update(world.owner)).rejects.toBeInstanceOf(CourseArchived);
    await expect(update(world.admin)).rejects.toBeInstanceOf(CourseArchived);
  });
});
