import { beforeEach, describe, expect, test } from 'vitest';

import { courseWorld } from '@tests/support/courseWorld';

import { Forbidden } from '@application/errors/common';
import { CourseNotPublished } from '@application/errors/course';
import { ArchiveCourseUseCase } from '@application/usecases/course/ArchiveCourseUseCase';

let world: Awaited<ReturnType<typeof courseWorld>>;
let archive: ArchiveCourseUseCase;

beforeEach(async () => {
  world = await courseWorld();
  archive = new ArchiveCourseUseCase(world.courses);
});

describe('ArchiveCourseUseCase', () => {
  test('archives only a published course', async () => {
    await expect(archive.execute(world.as(world.owner))).rejects.toBeInstanceOf(
      CourseNotPublished,
    );
  });

  test('lets an admin archive and refuses another instructor', async () => {
    await world.setCourse({ lessonCount: 1 });
    await world.courses.publish(world.course.id, new Date());

    await expect(archive.execute(world.as(world.other))).rejects.toBeInstanceOf(
      Forbidden,
    );
    await expect(archive.execute(world.as(world.admin))).resolves.toMatchObject(
      { status: 'ARCHIVED' },
    );
  });
});
