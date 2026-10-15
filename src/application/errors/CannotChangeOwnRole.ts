import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class CannotChangeOwnRole extends ApplicationError {
  readonly code = ErrorCode.CannotChangeOwnRole;
  readonly statusCode = 403;

  constructor() {
    super('You cannot change your own role.');
    this.name = 'CannotChangeOwnRole';
  }
}
