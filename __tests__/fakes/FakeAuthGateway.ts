import { AuthUserExists } from '@application/errors/AuthUserExists';
import { AuthUserNotPending } from '@application/errors/AuthUserNotPending';
import { InvalidCode } from '@application/errors/InvalidCode';
import { AuthGateway } from '@application/gateways/AuthGateway';

export class FakeAuthGateway extends AuthGateway {
  readonly users = new Map<string, 'UNCONFIRMED' | 'CONFIRMED'>();
  readonly signUps: AuthGateway.SignUpParams[] = [];
  readonly codes = new Map<string, string>();
  readonly resends: string[] = [];
  failOnSignUp: Error | undefined;
  failOnResend: Error | undefined;
  failOnTokens: Error | undefined;
  readonly refreshTokensIssued: string[] = [];

  signUp(params: AuthGateway.SignUpParams): Promise<AuthGateway.SignUpResult> {
    this.signUps.push(params);

    if (this.failOnSignUp) {
      return Promise.reject(this.failOnSignUp);
    }

    if (this.users.has(params.email)) {
      return Promise.reject(new AuthUserExists(params.email));
    }

    this.users.set(params.email, 'UNCONFIRMED');
    this.codes.set(params.email, '123456');

    return Promise.resolve({ externalId: `sub-${params.email}` });
  }

  deleteUnconfirmedUser(
    email: string,
  ): Promise<AuthGateway.DeleteUnconfirmedResult> {
    const status = this.users.get(email);

    if (!status) {
      return Promise.resolve('not-found');
    }

    if (status === 'CONFIRMED') {
      return Promise.resolve('confirmed');
    }

    this.users.delete(email);

    return Promise.resolve('deleted');
  }

  confirmSignUp(email: string, code: string): Promise<void> {
    const status = this.users.get(email);

    if (status === 'CONFIRMED') {
      return Promise.reject(new AuthUserNotPending(email));
    }

    if (!status || this.codes.get(email) !== code) {
      return Promise.reject(new InvalidCode());
    }

    this.users.set(email, 'CONFIRMED');

    return Promise.resolve();
  }

  resendConfirmationCode(email: string): Promise<void> {
    this.resends.push(email);

    return this.failOnResend
      ? Promise.reject(this.failOnResend)
      : Promise.resolve();
  }

  isUserConfirmed(email: string): Promise<boolean> {
    return Promise.resolve(this.users.get(email) === 'CONFIRMED');
  }

  signIn({ email }: AuthGateway.SignInParams): Promise<AuthGateway.Tokens> {
    return this.issueTokens(`refresh-${email}`);
  }

  refreshTokens(refreshToken: string): Promise<AuthGateway.Tokens> {
    return this.issueTokens(`${refreshToken}+`);
  }

  private issueTokens(refreshToken: string): Promise<AuthGateway.Tokens> {
    if (this.failOnTokens) {
      return Promise.reject(this.failOnTokens);
    }

    this.refreshTokensIssued.push(refreshToken);

    return Promise.resolve({
      accessToken: 'access',
      refreshToken,
      expiresIn: 3600,
    });
  }
}
