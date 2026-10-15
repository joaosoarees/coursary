import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class OutlineTooLarge extends ApplicationError {
  readonly code = ErrorCode.OutlineTooLarge;
  readonly statusCode = 400;

  constructor() {
    super('The outline moves too many items at once.');
    this.name = 'OutlineTooLarge';
  }
}
