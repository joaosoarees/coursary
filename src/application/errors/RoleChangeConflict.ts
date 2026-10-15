import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class RoleChangeConflict extends ApplicationError {
  readonly code = ErrorCode.Conflict;
  readonly statusCode = 409;

  constructor() {
    super('The account changed in the meantime. Try again.');
    this.name = 'RoleChangeConflict';
  }
}
