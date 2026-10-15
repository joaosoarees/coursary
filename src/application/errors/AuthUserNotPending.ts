export class AuthUserNotPending extends Error {
  constructor(readonly email: string) {
    super('The identity provider has no user waiting for this confirmation.');
    this.name = 'AuthUserNotPending';
  }
}
