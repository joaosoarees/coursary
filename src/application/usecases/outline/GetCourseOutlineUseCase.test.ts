import { beforeEach, describe, expect, it } from 'vitest';

import { courseWorld } from '@tests/support/courseWorld';

import { CourseNotFound } from '@application/errors/course';
import { GetCourseOutlineUseCase } from '@application/usecases/outline/GetCourseOutlineUseCase';

let world: Awaited<ReturnType<typeof courseWorld>>;

beforeEach(async () => {
  world = await courseWorld();
});

describe('GetCourseOutlineUseCase', () => {
  it('should hide the outline of a draft from another instructor', async () => {
    await expect(
      new GetCourseOutlineUseCase(world.courses, world.outline).execute(
        world.as(world.other),
      ),
    ).rejects.toBeInstanceOf(CourseNotFound);
  });
});
