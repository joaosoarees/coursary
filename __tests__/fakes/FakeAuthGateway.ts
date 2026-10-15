import { AuthUserExists } from '@application/errors/AuthUserExists';
import { AuthGateway } from '@application/gateways/AuthGateway';

export class FakeAuthGateway extends AuthGateway {
  readonly users = new Map<string, 'UNCONFIRMED' | 'CONFIRMED'>();
  readonly signUps: AuthGateway.SignUpParams[] = [];
  failOnSignUp: Error | undefined;

  signUp(params: AuthGateway.SignUpParams): Promise<AuthGateway.SignUpResult> {
    this.signUps.push(params);

    if (this.failOnSignUp) {
      return Promise.reject(this.failOnSignUp);
    }

    if (this.users.has(params.email)) {
      return Promise.reject(new AuthUserExists(params.email));
    }

    this.users.set(params.email, 'UNCONFIRMED');

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
}
