import { beforeEach, describe, expect, it } from 'vitest';

import { FakeAuthGateway } from '@tests/fakes/FakeAuthGateway';
import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';

import { TooManyRequests } from '@application/errors/common';
import { ResendConfirmationCodeUseCase } from '@application/usecases/auth/ResendConfirmationCodeUseCase';
import { SignUpUseCase } from '@application/usecases/auth/SignUpUseCase';

let accounts: InMemoryAccountRepository;
let auth: FakeAuthGateway;
let resendCode: ResendConfirmationCodeUseCase;

beforeEach(async () => {
  accounts = new InMemoryAccountRepository();
  auth = new FakeAuthGateway();
  resendCode = new ResendConfirmationCodeUseCase(accounts, auth);
  await new SignUpUseCase(accounts, auth).execute({
    name: 'Ana',
    email: 'ana@example.com',
    password: 'secret123',
  });
});

describe('ResendConfirmationCodeUseCase', () => {
  it('should send a new code to a pending account', async () => {
    await resendCode.execute({ email: ' Ana@Example.com ' });

    expect(auth.resends).toEqual(['ana@example.com']);
  });

  it('should send nothing when there is no pending account', async () => {
    await expect(
      resendCode.execute({ email: 'nobody@example.com' }),
    ).resolves.toBeUndefined();
    expect(auth.resends).toEqual([]);
  });

  it('should let the service limits through', async () => {
    auth.failOnResend = new TooManyRequests();

    await expect(
      resendCode.execute({ email: 'ana@example.com' }),
    ).rejects.toBeInstanceOf(TooManyRequests);
  });
});
