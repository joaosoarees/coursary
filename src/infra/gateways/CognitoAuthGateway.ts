import { createHmac } from 'node:crypto';

import {
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminGetUserCommand,
  AdminUserGlobalSignOutCommand,
  type AuthenticationResultType,
  CodeMismatchException,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ExpiredCodeException,
  ForgotPasswordCommand,
  GetTokensFromRefreshTokenCommand,
  InitiateAuthCommand,
  InvalidParameterException,
  InvalidPasswordException,
  LimitExceededException,
  NotAuthorizedException,
  PasswordResetRequiredException,
  RefreshTokenReuseException,
  ResendConfirmationCodeCommand,
  SignUpCommand,
  TooManyFailedAttemptsException,
  TooManyRequestsException,
  UserLambdaValidationException,
  UsernameExistsException,
  UserNotConfirmedException,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';

import { AccountUnavailable } from '@application/errors/AccountUnavailable';
import { AuthUserExists } from '@application/errors/AuthUserExists';
import { AuthUserNotPending } from '@application/errors/AuthUserNotPending';
import { EmailNotConfirmed } from '@application/errors/EmailNotConfirmed';
import { ErrorCode } from '@application/errors/ErrorCode';
import { InvalidCode } from '@application/errors/InvalidCode';
import { InvalidCredentials } from '@application/errors/InvalidCredentials';
import { InvalidPassword } from '@application/errors/InvalidPassword';
import { InvalidSession } from '@application/errors/InvalidSession';
import { TooManyRequests } from '@application/errors/TooManyRequests';
import type { AuthGateway } from '@application/gateways/AuthGateway';
import { cognitoClient } from '@infra/clients/cognitoClient';
import { AppConfig } from '@shared/config/AppConfig';

export class CognitoAuthGateway implements AuthGateway {
  constructor(private readonly config: AppConfig) {}

  async signUp({
    email,
    password,
    internalId,
  }: AuthGateway.SignUpParams): Promise<AuthGateway.SignUpResult> {
    try {
      const command = new SignUpCommand({
        ClientId: this.config.cognitoClientId,
        SecretHash: this.secretHash(email),
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'custom:internalId', Value: internalId },
        ],
      });

      const { UserSub } = await cognitoClient.send(command);

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

      throw CognitoAuthGateway.translateLimits(error);
    }
  }

  async signIn({
    email,
    password,
  }: AuthGateway.SignInParams): Promise<AuthGateway.Tokens> {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.config.cognitoClientId,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: this.secretHash(email),
        },
      });

      const { AuthenticationResult, ChallengeName } =
        await cognitoClient.send(command);

      return CognitoAuthGateway.toTokens(AuthenticationResult, ChallengeName);
    } catch (error) {
      if (
        error instanceof NotAuthorizedException ||
        error instanceof PasswordResetRequiredException ||
        error instanceof UserNotFoundException
      ) {
        throw new InvalidCredentials();
      }

      if (error instanceof UserNotConfirmedException) {
        throw new EmailNotConfirmed();
      }

      const refusal = CognitoAuthGateway.translateTokenRefusal(error);

      throw CognitoAuthGateway.translateLimits(refusal);
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthGateway.Tokens> {
    try {
      const command = new GetTokensFromRefreshTokenCommand({
        ClientId: this.config.cognitoClientId,
        ClientSecret: this.config.cognitoClientSecret,
        RefreshToken: refreshToken,
      });

      const { AuthenticationResult } = await cognitoClient.send(command);

      return CognitoAuthGateway.toTokens(AuthenticationResult);
    } catch (error) {
      if (
        error instanceof NotAuthorizedException ||
        error instanceof RefreshTokenReuseException ||
        error instanceof UserNotFoundException
      ) {
        throw new InvalidSession();
      }

      const refusal = CognitoAuthGateway.translateTokenRefusal(error);

      throw CognitoAuthGateway.translateLimits(refusal);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.config.cognitoClientId,
        Username: email,
        SecretHash: this.secretHash(email),
      });

      await cognitoClient.send(command);
    } catch (error) {
      if (
        error instanceof UserNotFoundException ||
        error instanceof InvalidParameterException ||
        error instanceof NotAuthorizedException
      ) {
        console.warn(
          JSON.stringify({ event: 'ResetCodeNotSent', reason: error.name }),
        );
        return;
      }

      throw CognitoAuthGateway.translateLimits(error);
    }
  }

  async resetPassword({
    email,
    code,
    newPassword,
  }: AuthGateway.ResetPasswordParams): Promise<void> {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.config.cognitoClientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
        SecretHash: this.secretHash(email),
      });

      await cognitoClient.send(command);
    } catch (error) {
      if (
        error instanceof CodeMismatchException ||
        error instanceof ExpiredCodeException ||
        error instanceof UserNotFoundException ||
        error instanceof UserNotConfirmedException ||
        error instanceof NotAuthorizedException
      ) {
        throw new InvalidCode();
      }

      if (error instanceof InvalidPasswordException) {
        throw new InvalidPassword();
      }

      throw CognitoAuthGateway.translateLimits(error);
    }
  }

  async signOutEverywhere(email: string): Promise<void> {
    const command = new AdminUserGlobalSignOutCommand({
      UserPoolId: this.config.cognitoPoolId,
      Username: email,
    });

    await cognitoClient.send(command);
  }

  async disableUser(email: string): Promise<void> {
    const command = new AdminDisableUserCommand({
      UserPoolId: this.config.cognitoPoolId,
      Username: email,
    });

    await cognitoClient.send(command);
  }

  async enableUser(email: string): Promise<void> {
    const command = new AdminEnableUserCommand({
      UserPoolId: this.config.cognitoPoolId,
      Username: email,
    });

    await cognitoClient.send(command);
  }

  async confirmSignUp(email: string, code: string): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.config.cognitoClientId,
        Username: email,
        ConfirmationCode: code,
        SecretHash: this.secretHash(email),
      });

      await cognitoClient.send(command);
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

      throw CognitoAuthGateway.translateLimits(error);
    }
  }

  async resendConfirmationCode(email: string): Promise<void> {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.config.cognitoClientId,
        Username: email,
        SecretHash: this.secretHash(email),
      });

      await cognitoClient.send(command);
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

      throw CognitoAuthGateway.translateLimits(error);
    }
  }

  async isUserConfirmed(email: string): Promise<boolean> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.config.cognitoPoolId,
        Username: email,
      });

      const { UserStatus } = await cognitoClient.send(command);

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
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId,
        Username: email,
      });

      const { UserStatus } = await cognitoClient.send(getUserCommand);

      if (UserStatus !== 'UNCONFIRMED') {
        return 'confirmed';
      }

      const deleteUserCommand = new AdminDeleteUserCommand({
        UserPoolId,
        Username: email,
      });

      await cognitoClient.send(deleteUserCommand);

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

  private static translateLimits(error: unknown): unknown {
    if (
      error instanceof TooManyRequestsException ||
      error instanceof LimitExceededException ||
      error instanceof TooManyFailedAttemptsException
    ) {
      return new TooManyRequests();
    }

    return error;
  }

  private static toTokens(
    result: AuthenticationResultType | undefined,
    challenge?: string,
  ): AuthGateway.Tokens {
    if (!result?.AccessToken || !result.RefreshToken || !result.ExpiresIn) {
      throw new Error(
        `Cognito issued no tokens${challenge ? ` (challenge ${challenge})` : ''}.`,
      );
    }

    return {
      accessToken: result.AccessToken,
      refreshToken: result.RefreshToken,
      expiresIn: result.ExpiresIn,
    };
  }

  private static translateTokenRefusal(error: unknown): unknown {
    if (
      error instanceof UserLambdaValidationException &&
      error.message.includes(ErrorCode.AccountUnavailable)
    ) {
      return new AccountUnavailable();
    }

    return error;
  }
}
