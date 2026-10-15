import { createHmac } from 'node:crypto';

import {
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  InvalidPasswordException,
  LimitExceededException,
  SignUpCommand,
  TooManyRequestsException,
  UsernameExistsException,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';

import { AuthUserExists } from '@application/errors/AuthUserExists';
import { InvalidPassword } from '@application/errors/InvalidPassword';
import { TooManyRequests } from '@application/errors/TooManyRequests';
import { AuthGateway } from '@application/gateways/AuthGateway';
import { cognitoClient } from '@infra/clients/cognitoClient';
import { Injectable } from '@kernel/decorators/Injectable';
import { AppConfig } from '@shared/config/AppConfig';

@Injectable()
export class CognitoAuthGateway extends AuthGateway {
  constructor(private readonly config: AppConfig) {
    super();
  }

  async signUp({
    email,
    password,
    internalId,
  }: AuthGateway.SignUpParams): Promise<AuthGateway.SignUpResult> {
    try {
      const { UserSub } = await cognitoClient.send(
        new SignUpCommand({
          ClientId: this.config.cognitoClientId,
          SecretHash: this.secretHash(email),
          Username: email,
          Password: password,
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'custom:internalId', Value: internalId },
          ],
        }),
      );

      if (!UserSub) {
        throw new Error('Cognito signed the user up without returning a sub.');
      }

      return { externalId: UserSub };
    } catch (error) {
      if (error instanceof UsernameExistsException) {
        throw new AuthUserExists(email);
      }

      if (error instanceof InvalidPasswordException) {
        throw new InvalidPassword();
      }

      if (
        error instanceof TooManyRequestsException ||
        error instanceof LimitExceededException
      ) {
        throw new TooManyRequests();
      }

      throw error;
    }
  }

  async deleteUnconfirmedUser(
    email: string,
  ): Promise<AuthGateway.DeleteUnconfirmedResult> {
    const UserPoolId = this.config.cognitoPoolId;

    try {
      const { UserStatus } = await cognitoClient.send(
        new AdminGetUserCommand({ UserPoolId, Username: email }),
      );

      if (UserStatus !== 'UNCONFIRMED') {
        return 'confirmed';
      }

      await cognitoClient.send(
        new AdminDeleteUserCommand({ UserPoolId, Username: email }),
      );

      return 'deleted';
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        return 'not-found';
      }

      throw error;
    }
  }

  private secretHash(username: string): string {
    return createHmac('sha256', this.config.cognitoClientSecret)
      .update(username + this.config.cognitoClientId)
      .digest('base64');
  }
}
