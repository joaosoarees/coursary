import { describe, expect, it } from 'vitest';

import { refreshTokensSchema } from '@application/controllers/auth/RefreshTokensController';
import { signInSchema } from '@application/controllers/auth/SignInController';

describe('signInSchema', () => {
  it('should not apply the password policy to a sign-in', () => {
    expect(
      signInSchema.safeParse({ email: 'ana@example.com', password: 'x' })
        .success,
    ).toBe(true);
  });

  it('should refuse an empty password', () => {
    expect(
      signInSchema.safeParse({ email: 'ana@example.com', password: '' })
        .success,
    ).toBe(false);
  });
});

describe('refreshTokensSchema', () => {
  it('should accept a token in the characters Cognito uses', () => {
    expect(
      refreshTokensSchema.safeParse({ refreshToken: 'eyJ.a-b_c=' }).success,
    ).toBe(true);
  });

  it('should refuse anything else', () => {
    expect(refreshTokensSchema.safeParse({ refreshToken: 'a b' }).success).toBe(
      false,
    );
  });
});
