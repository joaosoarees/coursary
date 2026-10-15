import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class OutlineMismatch extends ApplicationError {
  readonly code = ErrorCode.OutlineMismatch;
  readonly statusCode = 400;

  constructor() {
    super('The outline must list every module and lesson of the course once.');
    this.name = 'OutlineMismatch';
  }
}
