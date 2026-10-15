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

import { AuthUserExists } from '@application/errors/AuthUserExists';
import { AuthUserNotPending } from '@application/errors/AuthUserNotPending';
import { InvalidCode } from '@application/errors/InvalidCode';
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

      throw translateLimits(error);
    }
  }

  async confirmSignUp(email: string, code: string): Promise<void> {
    try {
      await cognitoClient.send(
        new ConfirmSignUpCommand({
          ClientId: this.config.cognitoClientId,
          Username: email,
          ConfirmationCode: code,
          SecretHash: this.secretHash(email),
        }),
      );
    } catch (error) {
      if (
        error instanceof CodeMismatchException ||
        error instanceof ExpiredCodeException ||
        error instanceof UserNotFoundException
      ) {
        throw new InvalidCode();
      }

      if (error instanceof NotAuthorizedException) {
        throw new AuthUserNotPending(email);
      }

      throw translateLimits(error);
    }
  }

  async resendConfirmationCode(email: string): Promise<void> {
    try {
      await cognitoClient.send(
        new ResendConfirmationCodeCommand({
          ClientId: this.config.cognitoClientId,
          Username: email,
          SecretHash: this.secretHash(email),
        }),
      );
    } catch (error) {
      if (
        error instanceof UserNotFoundException ||
        error instanceof InvalidParameterException
      ) {
        console.warn(
          JSON.stringify({ event: 'ResendCodeSkipped', reason: error.name }),
        );
        return;
      }

      throw translateLimits(error);
    }
  }

  async isUserConfirmed(email: string): Promise<boolean> {
    try {
      const { UserStatus } = await cognitoClient.send(
        new AdminGetUserCommand({
          UserPoolId: this.config.cognitoPoolId,
          Username: email,
        }),
      );

      return UserStatus === 'CONFIRMED';
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        return false;
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

function translateLimits(error: unknown): unknown {
  if (
    error instanceof TooManyRequestsException ||
    error instanceof LimitExceededException ||
    error instanceof TooManyFailedAttemptsException
  ) {
    return new TooManyRequests();
  }

  return error;
}
