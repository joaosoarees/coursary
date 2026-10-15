import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeAuthGateway } from '@tests/fakes/FakeAuthGateway';
import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';

import { InvalidCode } from '@application/errors/auth';
import { ConfirmSignUpUseCase } from '@application/usecases/auth/ConfirmSignUpUseCase';
import { SignUpUseCase } from '@application/usecases/auth/SignUpUseCase';

const email = 'ana@example.com';

let accounts: InMemoryAccountRepository;
let auth: FakeAuthGateway;
let confirmSignUp: ConfirmSignUpUseCase;
let accountId: string;

beforeEach(async () => {
  accounts = new InMemoryAccountRepository();
  auth = new FakeAuthGateway();
  confirmSignUp = new ConfirmSignUpUseCase(accounts, auth);
  ({ accountId } = await new SignUpUseCase(accounts, auth).execute({
    name: 'Ana',
    email,
    password: 'secret123',
  }));
});

describe('ConfirmSignUpUseCase', () => {
  it('should confirm the user and activate the account', async () => {
    await confirmSignUp.execute({ email: ' Ana@Example.com ', code: '123456' });

    expect(auth.users.get(email)).toBe('CONFIRMED');
    expect(accounts.accounts.get(accountId)?.status).toBe('ACTIVE');
  });

  it('should refuse a wrong code and keep the account pending', async () => {
    await expect(
      confirmSignUp.execute({ email, code: '000000' }),
    ).rejects.toBeInstanceOf(InvalidCode);
    expect(accounts.accounts.get(accountId)?.status).toBe('PENDING');
  });

  it('should refuse an e-mail without a pending account before asking the identity provider', async () => {
    auth.users.set('orphan@example.com', 'UNCONFIRMED');
    auth.codes.set('orphan@example.com', '123456');

    await expect(
      confirmSignUp.execute({ email: 'orphan@example.com', code: '123456' }),
    ).rejects.toBeInstanceOf(InvalidCode);
    expect(auth.users.get('orphan@example.com')).toBe('UNCONFIRMED');
  });

  it('should refuse an account that is already active', async () => {
    await confirmSignUp.execute({ email, code: '123456' });

    await expect(
      confirmSignUp.execute({ email, code: '123456' }),
    ).rejects.toBeInstanceOf(InvalidCode);
  });

  it('should finish an activation that failed after the user was confirmed', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    accounts.failOnActivate = new Error('table throttled');
    await expect(
      confirmSignUp.execute({ email, code: '123456' }),
    ).rejects.toThrow('table throttled');
    accounts.failOnActivate = undefined;

    await confirmSignUp.execute({ email, code: 'any' });

    expect(accounts.accounts.get(accountId)?.status).toBe('ACTIVE');
    expect(JSON.parse(log.mock.calls[0]?.[0] as string)).toEqual({
      event: 'ConfirmedUserWithPendingAccount',
      accountId,
    });
  });

  it('should refuse when the identity provider has the user in another state', async () => {
    auth.users.set(email, 'CONFIRMED');
    vi.spyOn(auth, 'isUserConfirmed').mockResolvedValue(false);

    await expect(
      confirmSignUp.execute({ email, code: '123456' }),
    ).rejects.toBeInstanceOf(InvalidCode);
    expect(accounts.accounts.get(accountId)?.status).toBe('PENDING');
  });
});
