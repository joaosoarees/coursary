import { beforeEach, describe, expect, test } from 'vitest';

import { courseWorld } from '@tests/support/courseWorld';

import {
  CourseArchived,
  CourseEmpty,
  CourseNotFound,
} from '@application/errors/course';
import { PublishCourseUseCase } from '@application/usecases/course/PublishCourseUseCase';

let world: Awaited<ReturnType<typeof courseWorld>>;
let publish: PublishCourseUseCase;

beforeEach(async () => {
  world = await courseWorld();
  publish = new PublishCourseUseCase(world.courses);
});

describe('PublishCourseUseCase', () => {
  test('refuses to publish a course without lessons', async () => {
    await expect(publish.execute(world.as(world.owner))).rejects.toBeInstanceOf(
      CourseEmpty,
    );
  });

  test('publishes once and answers the same course when asked again', async () => {
    await world.setCourse({ lessonCount: 1 });

    const first = await publish.execute(world.as(world.owner));
    const again = await publish.execute(world.as(world.owner));

    expect(first.status).toBe('PUBLISHED');
    expect(again.publishedAt).toBe(first.publishedAt);
  });

  test('hides a draft from another instructor and refuses an archived course', async () => {
    await world.setCourse({ lessonCount: 1 });
    await expect(publish.execute(world.as(world.other))).rejects.toBeInstanceOf(
      CourseNotFound,
    );

    await world.setCourse({ status: 'ARCHIVED' });
    await expect(publish.execute(world.as(world.owner))).rejects.toBeInstanceOf(
      CourseArchived,
    );
  });
});
