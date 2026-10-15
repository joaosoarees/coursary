import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class InvalidSession extends ApplicationError {
  readonly code = ErrorCode.InvalidSession;
  readonly statusCode = 401;

  constructor() {
    super('The session is not valid. Sign in again.');
    this.name = 'InvalidSession';
  }
}
