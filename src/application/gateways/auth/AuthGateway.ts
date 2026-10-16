import type { Account } from '@application/entities/account/Account';

export interface AuthGateway {
  signUp(params: AuthGateway.SignUpParams): Promise<AuthGateway.SignUpResult>;

  signIn(params: AuthGateway.SignInParams): Promise<AuthGateway.Issued>;

  refreshTokens(refreshToken: string): Promise<AuthGateway.Issued>;

  forgotPassword(email: string): Promise<void>;

  resetPassword(params: AuthGateway.ResetPasswordParams): Promise<void>;

  confirmSignUp(email: string, code: string): Promise<void>;

  resendConfirmationCode(email: string): Promise<void>;

  isUserConfirmed(email: string): Promise<boolean>;

  deleteUnconfirmedUser(
    email: string,
  ): Promise<AuthGateway.DeleteUnconfirmedResult>;
}

export namespace AuthGateway {
  export interface SignUpParams {
    email: string;
    password: string;
    internalId: string;
  }

  export interface SignUpResult {
    externalId: string;
  }

  export interface SignInParams {
    email: string;
    password: string;
  }

  export interface ResetPasswordParams {
    email: string;
    code: string;
    newPassword: string;
  }

  export interface Tokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }

  export interface Issued {
    tokens: Tokens;
    accountId: Account.Id;
    accessJti: string;
  }

  export type DeleteUnconfirmedResult = 'deleted' | 'not-found' | 'confirmed';
}
