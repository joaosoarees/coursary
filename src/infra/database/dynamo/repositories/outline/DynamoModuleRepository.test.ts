import { beforeEach, describe, expect, it } from 'vitest';

import { courseWorld } from '@tests/support/courseWorld';

import { Conflict } from '@application/errors/common';

let world: Awaited<ReturnType<typeof courseWorld>>;

beforeEach(async () => {
  world = await courseWorld();
});

describe('DynamoModuleRepository', () => {
  it('should refuse the whole change when the course status moved', async () => {
    const module = await world.addModule('M1', 0);
    await world.setCourse({ status: 'PUBLISHED' });
    module.title = 'Renamed';
    const unit = world.unitOfWork();
    unit.add(
      world.modules.renameOperation(module),
      world.courses.statusUnchangedOperation(world.course),
    );

    await expect(unit.commit()).rejects.toBeInstanceOf(Conflict);
    expect(
      (await world.modules.findById(world.course.id, module.id))?.title,
    ).toBe('M1');
  });
});
