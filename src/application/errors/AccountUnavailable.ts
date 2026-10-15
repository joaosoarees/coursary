import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class AccountUnavailable extends ApplicationError {
  readonly code = ErrorCode.AccountUnavailable;
  readonly statusCode = 403;

  constructor() {
    super('This account is not available.');
    this.name = 'AccountUnavailable';
  }
}
