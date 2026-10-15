import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class InvalidCredentials extends ApplicationError {
  readonly code = ErrorCode.InvalidCredentials;
  readonly statusCode = 401;

  constructor() {
    super('Incorrect e-mail or password.');
    this.name = 'InvalidCredentials';
  }
}
