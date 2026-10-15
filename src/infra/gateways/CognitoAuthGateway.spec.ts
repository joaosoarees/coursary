import { createHmac } from 'node:crypto';

import {
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  CodeMismatchException,
  ConfirmSignUpCommand,
  ExpiredCodeException,
  InvalidParameterException,
  InvalidPasswordException,
  LimitExceededException,
  NotAuthorizedException,
  ResendConfirmationCodeCommand,
  SignUpCommand,
  TooManyFailedAttemptsException,
  TooManyRequestsException,
  UsernameExistsException,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthUserExists } from '@application/errors/AuthUserExists';
import { AuthUserNotPending } from '@application/errors/AuthUserNotPending';
import { InvalidCode } from '@application/errors/InvalidCode';
import { InvalidPassword } from '@application/errors/InvalidPassword';
import { TooManyRequests } from '@application/errors/TooManyRequests';
import { cognitoClient } from '@infra/clients/cognitoClient';
import { CognitoAuthGateway } from '@infra/gateways/CognitoAuthGateway';
import { AppConfig } from '@shared/config/AppConfig';

const metadata = { $metadata: {}, message: 'from Cognito' };
const gateway = new CognitoAuthGateway(new AppConfig());
const signUpParams = {
  email: 'ana@example.com',
  password: 'secret123',
  internalId: '3KiXn2xer0YTzKh5D0ogq26ICge',
};

const send = () => vi.spyOn(cognitoClient, 'send');

const secretHashOf = (username: string) =>
  createHmac('sha256', 'client-secret')
    .update(`${username}client-id`)
    .digest('base64');

beforeEach(() => {
  vi.stubEnv('COGNITO_POOL_ID', 'sa-east-1_pool');
  vi.stubEnv('COGNITO_CLIENT_ID', 'client-id');
  vi.stubEnv('COGNITO_CLIENT_SECRET', 'client-secret');
});

describe('CognitoAuthGateway.signUp', () => {
  it('should sign the user up with the secret hash and the internal id', async () => {
    const spy = send().mockResolvedValue({ UserSub: 'sub-1' } as never);

    const result = await gateway.signUp(signUpParams);

    const command = spy.mock.calls[0]?.[0] as SignUpCommand;
    expect(command).toBeInstanceOf(SignUpCommand);
    expect(command.input).toMatchObject({
      ClientId: 'client-id',
      Username: 'ana@example.com',
      SecretHash: createHmac('sha256', 'client-secret')
        .update('ana@example.comclient-id')
        .digest('base64'),
      UserAttributes: [
        { Name: 'email', Value: 'ana@example.com' },
        { Name: 'custom:internalId', Value: signUpParams.internalId },
      ],
    });
    expect(result).toEqual({ externalId: 'sub-1' });
  });

  it.each([
    [new UsernameExistsException(metadata), AuthUserExists],
    [new InvalidPasswordException(metadata), InvalidPassword],
    [new TooManyRequestsException(metadata), TooManyRequests],
  ])('should translate %s', async (cognitoError, expected) => {
    send().mockRejectedValue(cognitoError);

    await expect(gateway.signUp(signUpParams)).rejects.toBeInstanceOf(expected);
  });

  it('should rethrow anything it does not translate', async () => {
    const unexpected = new Error('network down');
    send().mockRejectedValue(unexpected);

    await expect(gateway.signUp(signUpParams)).rejects.toBe(unexpected);
  });
});

describe('CognitoAuthGateway.deleteUnconfirmedUser', () => {
  it('should delete a user that never confirmed', async () => {
    const spy = send()
      .mockResolvedValueOnce({ UserStatus: 'UNCONFIRMED' } as never)
      .mockResolvedValueOnce({} as never);

    await expect(
      gateway.deleteUnconfirmedUser('ana@example.com'),
    ).resolves.toBe('deleted');
    expect(spy.mock.calls[1]?.[0]).toBeInstanceOf(AdminDeleteUserCommand);
  });

  it('should never delete a confirmed user', async () => {
    const spy = send().mockResolvedValue({ UserStatus: 'CONFIRMED' } as never);

    await expect(
      gateway.deleteUnconfirmedUser('ana@example.com'),
    ).resolves.toBe('confirmed');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toBeInstanceOf(AdminGetUserCommand);
  });

  it('should report a user that does not exist', async () => {
    send().mockRejectedValue(new UserNotFoundException(metadata));

    await expect(
      gateway.deleteUnconfirmedUser('ana@example.com'),
    ).resolves.toBe('not-found');
  });
});

describe('CognitoAuthGateway.confirmSignUp', () => {
  it('should confirm the user with the code and the secret hash', async () => {
    const spy = send().mockResolvedValue({} as never);

    await gateway.confirmSignUp('ana@example.com', '012345');

    const command = spy.mock.calls[0]?.[0] as ConfirmSignUpCommand;
    expect(command).toBeInstanceOf(ConfirmSignUpCommand);
    expect(command.input).toEqual({
      ClientId: 'client-id',
      Username: 'ana@example.com',
      ConfirmationCode: '012345',
      SecretHash: secretHashOf('ana@example.com'),
    });
  });

  it.each([
    [new CodeMismatchException(metadata), InvalidCode],
    [new ExpiredCodeException(metadata), InvalidCode],
    [new UserNotFoundException(metadata), InvalidCode],
    [new NotAuthorizedException(metadata), AuthUserNotPending],
    [new LimitExceededException(metadata), TooManyRequests],
    [new TooManyFailedAttemptsException(metadata), TooManyRequests],
  ])('should translate %s', async (cognitoError, expected) => {
    send().mockRejectedValue(cognitoError);

    await expect(
      gateway.confirmSignUp('ana@example.com', '012345'),
    ).rejects.toBeInstanceOf(expected);
  });
});

describe('CognitoAuthGateway.resendConfirmationCode', () => {
  it('should ask for a new code with the secret hash', async () => {
    const spy = send().mockResolvedValue({} as never);

    await gateway.resendConfirmationCode('ana@example.com');

    const command = spy.mock.calls[0]?.[0] as ResendConfirmationCodeCommand;
    expect(command).toBeInstanceOf(ResendConfirmationCodeCommand);
    expect(command.input).toEqual({
      ClientId: 'client-id',
      Username: 'ana@example.com',
      SecretHash: secretHashOf('ana@example.com'),
    });
  });

  it.each([
    new UserNotFoundException(metadata),
    new InvalidParameterException(metadata),
  ])('should answer like a success on %s', async (cognitoError) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    send().mockRejectedValue(cognitoError);

    await expect(
      gateway.resendConfirmationCode('ana@example.com'),
    ).resolves.toBeUndefined();
  });

  it('should translate the service limits', async () => {
    send().mockRejectedValue(new LimitExceededException(metadata));

    await expect(
      gateway.resendConfirmationCode('ana@example.com'),
    ).rejects.toBeInstanceOf(TooManyRequests);
  });
});

describe('CognitoAuthGateway.isUserConfirmed', () => {
  it.each([
    ['CONFIRMED', true],
    ['UNCONFIRMED', false],
  ])('should read a %s user as %s', async (UserStatus, expected) => {
    send().mockResolvedValue({ UserStatus } as never);

    await expect(gateway.isUserConfirmed('ana@example.com')).resolves.toBe(
      expected,
    );
  });

  it('should read a missing user as not confirmed', async () => {
    send().mockRejectedValue(new UserNotFoundException(metadata));

    await expect(gateway.isUserConfirmed('ana@example.com')).resolves.toBe(
      false,
    );
  });
});
