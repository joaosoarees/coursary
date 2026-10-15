import { describe, expect, it } from 'vitest';

import { signUpSchema } from '@application/controllers/auth/SignUpController';

const valid = { name: 'Ana', email: 'ana@example.com', password: 'secret123' };

describe('signUpSchema', () => {
  it('should accept a name, an e-mail and a password within the policy', () => {
    expect(signUpSchema.parse(valid)).toEqual(valid);
  });

  it.each([
    ['a short password', { password: 'abc1' }],
    ['a password without a number', { password: 'secretpass' }],
    ['a password without a lowercase letter', { password: 'SECRET123' }],
    ['an invalid e-mail', { email: 'ana' }],
    ['a blank name', { name: '   ' }],
  ])('should refuse %s', (_, change) => {
    expect(signUpSchema.safeParse({ ...valid, ...change }).success).toBe(false);
  });
});
