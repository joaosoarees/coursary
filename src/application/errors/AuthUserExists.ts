export class AuthUserExists extends Error {
  constructor(readonly email: string) {
    super('The identity provider already has a user with this e-mail.');
    this.name = 'AuthUserExists';
  }
}
