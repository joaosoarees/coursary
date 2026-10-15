import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class InvalidCode extends ApplicationError {
  readonly code = ErrorCode.InvalidCode;
  readonly statusCode = 400;

  constructor() {
    super('The code is wrong or has expired. Request a new one.');
    this.name = 'InvalidCode';
  }
}
