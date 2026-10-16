import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeAuthGateway } from '@tests/fakes/FakeAuthGateway';
import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';

import { Account } from '@application/entities/account/Account';
import { InvalidCode } from '@application/errors/auth';
import { ResetPasswordUseCase } from '@application/usecases/auth/ResetPasswordUseCase';

const params = {
  email: ' Ana@Example.com ',
  code: '012345',
  newPassword: 'newsecret1',
};
const session = { accessJti: 'jti-1', refreshTokenHash: 'hash-1' };

let auth: FakeAuthGateway;
let accounts: InMemoryAccountRepository;
let account: Account;
let resetPassword: ResetPasswordUseCase;

beforeEach(async () => {
  auth = new FakeAuthGateway();
  accounts = new InMemoryAccountRepository();
  account = Account.create({ name: 'Ana', email: 'ana@example.com' });
  await accounts.create(account);
  account.session = session;
  resetPassword = new ResetPasswordUseCase(auth, accounts);
});

describe('ResetPasswordUseCase', () => {
  it('should set the new password and end the session', async () => {
    await resetPassword.execute(params);

    expect(auth.passwordResets).toEqual([
      { ...params, email: 'ana@example.com' },
    ]);
    expect(account.session).toBeUndefined();
  });

  it('should end no session when the code is refused', async () => {
    auth.failOnReset = new InvalidCode();

    await expect(resetPassword.execute(params)).rejects.toBeInstanceOf(
      InvalidCode,
    );
    expect(account.session).toEqual(session);
  });

  it('should still succeed when the session could not be ended', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(accounts, 'clearSession').mockRejectedValue(
      new Error('throttled'),
    );

    await expect(resetPassword.execute(params)).resolves.toBeUndefined();
    expect(JSON.parse(log.mock.calls[0]?.[0] as string)).toMatchObject({
      event: 'SessionsNotRevoked',
    });
  });
});
