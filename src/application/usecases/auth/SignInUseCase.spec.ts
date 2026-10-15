import { beforeEach, describe, expect, it } from 'vitest';

import { FakeAuthGateway } from '@tests/fakes/FakeAuthGateway';
import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';

import { Account } from '@application/entities/Account';
import { InvalidSession } from '@application/errors/auth';
import { RefreshTokensUseCase } from '@application/usecases/auth/RefreshTokensUseCase';
import { SignInUseCase } from '@application/usecases/auth/SignInUseCase';

let auth: FakeAuthGateway;
let accounts: InMemoryAccountRepository;
let account: Account;
let signIn: SignInUseCase;
let refresh: RefreshTokensUseCase;

beforeEach(async () => {
  auth = new FakeAuthGateway();
  accounts = new InMemoryAccountRepository();
  account = Account.create({ name: 'Ana', email: 'ana@example.com' });
  await accounts.create(account);
  auth.accountIds.set('ana@example.com', account.id);
  signIn = new SignInUseCase(auth, accounts);
  refresh = new RefreshTokensUseCase(auth, accounts);
});

const credentials = { email: ' Ana@Example.com ', password: 'secret123' };

describe('SignInUseCase', () => {
  it('should sign in with the normalized e-mail and keep the new session', async () => {
    const tokens = await signIn.execute(credentials);

    expect(tokens).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh-ana@example.com-0',
      expiresIn: 3600,
    });
    expect(account.session).toEqual({
      accessJti: 'jti-1',
      refreshTokenHash: Account.hashRefreshToken('refresh-ana@example.com-0'),
    });
  });

  it('should replace the session of an earlier sign-in', async () => {
    const first = await signIn.execute(credentials);
    await signIn.execute(credentials);

    expect(account.session?.accessJti).toBe('jti-2');
    await expect(
      refresh.execute({ refreshToken: first.refreshToken }),
    ).rejects.toBeInstanceOf(InvalidSession);
  });
});

describe('RefreshTokensUseCase', () => {
  it('should rotate the session from the refresh token it holds', async () => {
    const first = await signIn.execute(credentials);

    const tokens = await refresh.execute({ refreshToken: first.refreshToken });

    expect(account.session).toEqual({
      accessJti: 'jti-2',
      refreshTokenHash: Account.hashRefreshToken(tokens.refreshToken),
    });
  });

  it('should refuse a refresh token that was rotated out', async () => {
    const first = await signIn.execute(credentials);
    await refresh.execute({ refreshToken: first.refreshToken });

    await expect(
      refresh.execute({ refreshToken: first.refreshToken }),
    ).rejects.toBeInstanceOf(InvalidSession);
  });
});
