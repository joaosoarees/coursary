import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class InvalidCursor extends ApplicationError {
  readonly code = ErrorCode.InvalidCursor;
  readonly statusCode = 400;

  constructor() {
    super('The cursor is not valid for this list.');
    this.name = 'InvalidCursor';
  }
}
