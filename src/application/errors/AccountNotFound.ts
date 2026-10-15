import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class AccountNotFound extends ApplicationError {
  readonly code = ErrorCode.AccountNotFound;
  readonly statusCode = 404;

  constructor() {
    super('The account does not exist.');
    this.name = 'AccountNotFound';
  }
}
