import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class Forbidden extends ApplicationError {
  readonly code = ErrorCode.Forbidden;
  readonly statusCode = 403;

  constructor() {
    super('You are not allowed to do this.');
    this.name = 'Forbidden';
  }
}
