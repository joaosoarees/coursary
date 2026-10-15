export abstract class AuthGateway {
  abstract signUp(
    params: AuthGateway.SignUpParams,
  ): Promise<AuthGateway.SignUpResult>;

  abstract signIn(
    params: AuthGateway.SignInParams,
  ): Promise<AuthGateway.Tokens>;

  abstract refreshTokens(refreshToken: string): Promise<AuthGateway.Tokens>;

  abstract confirmSignUp(email: string, code: string): Promise<void>;

  abstract resendConfirmationCode(email: string): Promise<void>;

  abstract isUserConfirmed(email: string): Promise<boolean>;

  abstract deleteUnconfirmedUser(
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

  export interface Tokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }

  export type DeleteUnconfirmedResult = 'deleted' | 'not-found' | 'confirmed';
}
