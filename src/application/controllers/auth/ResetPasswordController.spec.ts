import { describe, expect, it } from 'vitest';

import { resetPasswordSchema } from '@application/controllers/auth/ResetPasswordController';

const valid = {
  email: 'ana@example.com',
  code: '012345',
  newPassword: 'newsecret1',
};

describe('resetPasswordSchema', () => {
  it('should accept a code and a new password within the policy', () => {
    expect(resetPasswordSchema.parse(valid)).toEqual(valid);
  });

  it.each([
    ['a new password without a number', { newPassword: 'newsecret' }],
    ['a short new password', { newPassword: 'abc1' }],
    ['a blank code', { code: '' }],
  ])('should refuse %s', (_, change) => {
    expect(resetPasswordSchema.safeParse({ ...valid, ...change }).success).toBe(
      false,
    );
  });
});
