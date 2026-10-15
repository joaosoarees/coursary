import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class AccountConflict extends ApplicationError {
  readonly code = ErrorCode.Conflict;
  readonly statusCode = 409;

  constructor() {
    super('The account changed in the meantime. Try again.');
    this.name = 'AccountConflict';
  }
}
