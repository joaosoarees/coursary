import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeAuthGateway } from '@tests/fakes/FakeAuthGateway';
import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';

import { Account, accountStatuses } from '@application/entities/Account';
import { ForgotPasswordUseCase } from '@application/usecases/auth/ForgotPasswordUseCase';

let accounts: InMemoryAccountRepository;
let auth: FakeAuthGateway;
let forgotPassword: ForgotPasswordUseCase;
let account: Account;

beforeEach(async () => {
  accounts = new InMemoryAccountRepository();
  auth = new FakeAuthGateway();
  forgotPassword = new ForgotPasswordUseCase(accounts, auth);
  account = Account.create({ name: 'Ana', email: 'ana@example.com' });
  await accounts.create(account);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('ForgotPasswordUseCase', () => {
  it('should send a reset code to an active account', async () => {
    account.activate();

    await forgotPassword.execute({ email: ' Ana@Example.com ' });

    expect(auth.resetCodesSent).toEqual(['ana@example.com']);
  });

  it.each([accountStatuses.Pending, accountStatuses.Disabled])(
    'should send nothing to a %s account',
    async (status) => {
      account.status = status;

      await forgotPassword.execute({ email: 'ana@example.com' });

      expect(auth.resetCodesSent).toEqual([]);
    },
  );

  it('should send nothing to an unknown e-mail', async () => {
    await forgotPassword.execute({ email: 'nobody@example.com' });

    expect(auth.resetCodesSent).toEqual([]);
  });
});
