import { describe, expect, it } from 'vitest';

import { newAccountId, toAccountId } from '@application/entities/AccountId';

describe('AccountId', () => {
  it('should accept a KSUID', () => {
    const id = newAccountId();

    expect(toAccountId(id)).toBe(id);
  });

  it('should sort by creation time', async () => {
    const first = newAccountId();
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const second = newAccountId();

    expect(first < second).toBe(true);
  });

  it.each(['', 'abc', 'not a ksuid at all 123456789', '2NxK8q-'])(
    'should refuse %j',
    (value) => {
      expect(() => toAccountId(value)).toThrow(TypeError);
    },
  );
});
