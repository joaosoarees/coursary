export abstract class AuthGateway {
  abstract signUp(
    params: AuthGateway.SignUpParams,
  ): Promise<AuthGateway.SignUpResult>;

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

  export type DeleteUnconfirmedResult = 'deleted' | 'not-found' | 'confirmed';
}
