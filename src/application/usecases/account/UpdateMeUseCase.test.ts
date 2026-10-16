import { beforeEach, describe, expect, test } from 'vitest';

import { courseWorld } from '@tests/support/courseWorld';

import { AccountUnavailable } from '@application/errors/auth';
import { UpdateMeUseCase } from '@application/usecases/account/UpdateMeUseCase';

let world: Awaited<ReturnType<typeof courseWorld>>;
let updateMe: UpdateMeUseCase;

beforeEach(async () => {
  world = await courseWorld();
  await world.accounts.create(world.owner);
  updateMe = new UpdateMeUseCase(world.accounts, world.courses);
});

describe('UpdateMeUseCase', () => {
  test('renames the account and copies the name into its courses', async () => {
    const profile = await updateMe.execute({
      account: world.owner,
      name: 'Ana Souza',
    });

    expect(profile.name).toBe('Ana Souza');
    expect((await world.accounts.findById(world.owner.id))?.name).toBe(
      'Ana Souza',
    );
    expect((await world.storedCourse())?.instructorName).toBe('Ana Souza');
  });

  test('does not rename a disabled account', async () => {
    world.owner.status = 'DISABLED';

    await expect(
      updateMe.execute({ account: world.owner, name: 'Ana Souza' }),
    ).rejects.toBeInstanceOf(AccountUnavailable);
  });
});
