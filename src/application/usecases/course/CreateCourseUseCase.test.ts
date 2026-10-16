import { beforeEach, describe, expect, test } from 'vitest';

import { courseWorld } from '@tests/support/courseWorld';

import { AccountUnavailable } from '@application/errors/auth';
import { CreateCourseUseCase } from '@application/usecases/course/CreateCourseUseCase';

let world: Awaited<ReturnType<typeof courseWorld>>;
let create: CreateCourseUseCase;

beforeEach(async () => {
  world = await courseWorld();
  create = new CreateCourseUseCase(world.courses);
});

describe('CreateCourseUseCase', () => {
  test('creates a draft owned by the caller, with the caller name', async () => {
    const created = await create.execute({
      instructor: world.owner,
      title: ' DynamoDB ',
      description: 'Keys',
    });

    expect(created).toMatchObject({
      instructorId: world.owner.id,
      instructorName: 'ana',
      title: 'DynamoDB',
      status: 'DRAFT',
      lessonCount: 0,
      publishedAt: null,
    });
  });

  test('refuses an account that is not active', async () => {
    world.owner.status = 'DISABLED';

    await expect(
      create.execute({ instructor: world.owner, title: 'T', description: '' }),
    ).rejects.toBeInstanceOf(AccountUnavailable);
  });
});
