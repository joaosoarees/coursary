import { describe, expect, it } from 'vitest';

import { confirmSignUpSchema } from '@application/controllers/auth/ConfirmSignUpController';

const valid = { email: 'ana@example.com', code: '012345' };

describe('confirmSignUpSchema', () => {
  it('should keep the code as text, leading zero included', () => {
    expect(confirmSignUpSchema.parse(valid)).toEqual(valid);
  });

  it.each([
    ['a blank code', { code: '' }],
    ['a code with spaces', { code: '012 345' }],
    ['a numeric code', { code: 12345 }],
    ['an invalid e-mail', { email: 'ana' }],
  ])('should refuse %s', (_, change) => {
    expect(confirmSignUpSchema.safeParse({ ...valid, ...change }).success).toBe(
      false,
    );
  });
});
