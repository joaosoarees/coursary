import { createHmac } from 'node:crypto';

import {
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  InvalidPasswordException,
  SignUpCommand,
  TooManyRequestsException,
  UsernameExistsException,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthUserExists } from '@application/errors/AuthUserExists';
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
