import { beforeEach, describe, expect, it } from 'vitest';

import { outlineWorld } from '@tests/outlineWorld';

import { Forbidden } from '@application/errors/common';
import {
  CourseArchived,
  CourseEmpty,
  CourseNotFound,
  CourseNotPublished,
} from '@application/errors/course';
import { ArchiveCourseUseCase } from '@application/usecases/course/ArchiveCourseUseCase';
import { PublishCourseUseCase } from '@application/usecases/course/PublishCourseUseCase';

let world: Awaited<ReturnType<typeof outlineWorld>>;
let publish: PublishCourseUseCase;
let archive: ArchiveCourseUseCase;

beforeEach(async () => {
  world = await outlineWorld();
  publish = new PublishCourseUseCase(world.courses);
  archive = new ArchiveCourseUseCase(world.courses);
});

describe('publishing use cases', () => {
  it('should refuse to publish a course without lessons', async () => {
    await expect(publish.execute(world.as(world.owner))).rejects.toBeInstanceOf(
      CourseEmpty,
    );
  });

  it('should publish once and answer the same course when asked again', async () => {
    world.course.lessonCount = 1;

    const first = await publish.execute(world.as(world.owner));
    const again = await publish.execute(world.as(world.owner));

    expect(first.status).toBe('PUBLISHED');
    expect(first.publishedAt).not.toBeNull();
    expect(again.publishedAt).toBe(first.publishedAt);
  });

  it('should hide a draft from another instructor and refuse a published one', async () => {
    world.course.lessonCount = 1;
    await expect(publish.execute(world.as(world.other))).rejects.toBeInstanceOf(
      CourseNotFound,
    );

    await publish.execute(world.as(world.owner));
    await expect(archive.execute(world.as(world.other))).rejects.toBeInstanceOf(
      Forbidden,
    );
  });

  it('should archive only a published course, and an admin may do it', async () => {
    await expect(archive.execute(world.as(world.owner))).rejects.toBeInstanceOf(
      CourseNotPublished,
    );

    world.course.lessonCount = 1;
    await publish.execute(world.as(world.owner));
    const archived = await archive.execute(world.as(world.admin));

    expect(archived.status).toBe('ARCHIVED');
    await expect(publish.execute(world.as(world.owner))).rejects.toBeInstanceOf(
      CourseArchived,
    );
  });
});
