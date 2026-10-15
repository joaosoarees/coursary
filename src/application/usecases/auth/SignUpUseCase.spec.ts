import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeAuthGateway } from '@tests/fakes/FakeAuthGateway';
import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';

import { AuthUserExists } from '@application/errors/AuthUserExists';
import { EmailInUse } from '@application/errors/EmailInUse';
import { InvalidPassword } from '@application/errors/InvalidPassword';
import { SignUpUseCase } from '@application/usecases/auth/SignUpUseCase';

const input = { name: 'Ana', email: 'Ana@Example.com', password: 'secret123' };

let accounts: InMemoryAccountRepository;
let auth: FakeAuthGateway;
let signUp: SignUpUseCase;

beforeEach(() => {
  accounts = new InMemoryAccountRepository();
  auth = new FakeAuthGateway();
  signUp = new SignUpUseCase(accounts, auth);
});

describe('SignUpUseCase', () => {
  it('should create a pending account and a user carrying its id', async () => {
    const { accountId } = await signUp.execute(input);

    expect(accounts.accounts.get(accountId)).toMatchObject({
      email: 'ana@example.com',
      status: 'PENDING',
      externalId: 'sub-ana@example.com',
    });
    expect(auth.signUps[0]).toMatchObject({
      email: 'ana@example.com',
      internalId: accountId,
    });
  });

  it('should refuse an e-mail already claimed without calling the identity provider', async () => {
    await signUp.execute(input);

    await expect(signUp.execute(input)).rejects.toBeInstanceOf(EmailInUse);
    expect(auth.signUps).toHaveLength(1);
  });

  it('should undo the account when the identity provider refuses the user', async () => {
    auth.failOnSignUp = new InvalidPassword();

    await expect(signUp.execute(input)).rejects.toBeInstanceOf(InvalidPassword);
    expect(accounts.accounts.size).toBe(0);
    expect(accounts.claims.size).toBe(0);
  });

  it('should undo the user and the account when saving the external id fails', async () => {
    accounts.failOnSaveExternalId = new Error('table throttled');

    await expect(signUp.execute(input)).rejects.toThrow('table throttled');
    expect(auth.users.size).toBe(0);
    expect(accounts.accounts.size).toBe(0);
    expect(accounts.claims.size).toBe(0);
  });

  it('should replace an unconfirmed orphan left in the identity provider', async () => {
    auth.users.set('ana@example.com', 'UNCONFIRMED');

    const { accountId } = await signUp.execute(input);

    expect(auth.signUps).toHaveLength(2);
    expect(auth.users.get('ana@example.com')).toBe('UNCONFIRMED');
    expect(accounts.accounts.has(accountId)).toBe(true);
  });

  it('should keep a confirmed user, answer EmailInUse and free the new claim', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    auth.users.set('ana@example.com', 'CONFIRMED');

    await expect(signUp.execute(input)).rejects.toBeInstanceOf(EmailInUse);
    expect(auth.users.get('ana@example.com')).toBe('CONFIRMED');
    expect(accounts.claims.size).toBe(0);
  });

  it('should answer EmailInUse when the user reappears after the orphan is removed', async () => {
    auth.users.set('ana@example.com', 'UNCONFIRMED');
    auth.failOnSignUp = new AuthUserExists('ana@example.com');

    await expect(signUp.execute(input)).rejects.toBeInstanceOf(EmailInUse);
    expect(accounts.claims.size).toBe(0);
  });
});
