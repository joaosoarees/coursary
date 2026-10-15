import { describe, expect, it } from 'vitest';

import { FakeAuthGateway } from '@tests/fakes/FakeAuthGateway';

import { SignInUseCase } from '@application/usecases/auth/SignInUseCase';

describe('SignInUseCase', () => {
  it('should sign in with the normalized e-mail', async () => {
    const auth = new FakeAuthGateway();

    const tokens = await new SignInUseCase(auth).execute({
      email: ' Ana@Example.com ',
      password: 'secret123',
    });

    expect(tokens.refreshToken).toBe('refresh-ana@example.com');
  });
});
