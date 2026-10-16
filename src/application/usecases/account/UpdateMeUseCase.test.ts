import { beforeEach, describe, expect, test } from 'vitest';

import { courseWorld } from '@tests/support/courseWorld';

import { Enrollment } from '@application/entities/enrollment/Enrollment';
import { AccountUnavailable } from '@application/errors/auth';
import { UpdateMeUseCase } from '@application/usecases/account/UpdateMeUseCase';

let world: Awaited<ReturnType<typeof courseWorld>>;
let updateMe: UpdateMeUseCase;

beforeEach(async () => {
  world = await courseWorld();
  await world.accounts.create(world.owner);
  updateMe = new UpdateMeUseCase(
    world.accounts,
    world.courses,
    world.enrollments,
  );
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

  test('copies the name into every enrollment of the student, cancelled ones too', async () => {
    const student = world.other;
    await world.accounts.create(student);
    await world.setCourse({ status: 'PUBLISHED' });
    const enrollment = Enrollment.create({ student, course: world.course });
    const unit = world.unitOfWork();
    unit.add(world.enrollments.createOperation(enrollment));
    await unit.commit();
    const cancelling = world.unitOfWork();
    cancelling.add(world.enrollments.cancelOperation(enrollment));
    await cancelling.commit();

    await updateMe.execute({ account: student, name: 'Bia Lima' });

    await expect(
      world.enrollments.find(student.id, world.course.id),
    ).resolves.toMatchObject({ status: 'CANCELLED', studentName: 'Bia Lima' });
  });

  test('does not rename a disabled account', async () => {
    world.owner.status = 'DISABLED';

    await expect(
      updateMe.execute({ account: world.owner, name: 'Ana Souza' }),
    ).rejects.toBeInstanceOf(AccountUnavailable);
  });
});
