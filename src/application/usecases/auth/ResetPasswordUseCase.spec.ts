import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeAuthGateway } from '@tests/fakes/FakeAuthGateway';

import { InvalidCode } from '@application/errors/InvalidCode';
import { ResetPasswordUseCase } from '@application/usecases/auth/ResetPasswordUseCase';

const params = {
  email: ' Ana@Example.com ',
  code: '012345',
  newPassword: 'newsecret1',
};

let auth: FakeAuthGateway;
let resetPassword: ResetPasswordUseCase;

beforeEach(() => {
  auth = new FakeAuthGateway();
  resetPassword = new ResetPasswordUseCase(auth);
});

describe('ResetPasswordUseCase', () => {
  it('should set the new password and end every old session', async () => {
    await resetPassword.execute(params);

    expect(auth.passwordResets).toEqual([
      { ...params, email: 'ana@example.com' },
    ]);
    expect(auth.signedOut).toEqual(['ana@example.com']);
  });

  it('should end no session when the code is refused', async () => {
    auth.failOnReset = new InvalidCode();

    await expect(resetPassword.execute(params)).rejects.toBeInstanceOf(
      InvalidCode,
    );
    expect(auth.signedOut).toEqual([]);
  });

  it('should still succeed when the sessions could not be ended', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    auth.failOnSignOut = new Error('throttled');

    await expect(resetPassword.execute(params)).resolves.toBeUndefined();
    expect(JSON.parse(log.mock.calls[0]?.[0] as string)).toMatchObject({
      event: 'SessionsNotRevoked',
    });
  });
});
