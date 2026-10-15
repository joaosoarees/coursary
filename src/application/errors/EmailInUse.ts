import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class EmailInUse extends ApplicationError {
  readonly code = ErrorCode.EmailInUse;
  readonly statusCode = 409;

  constructor() {
    super('This e-mail address is already registered.');
    this.name = 'EmailInUse';
  }
}
