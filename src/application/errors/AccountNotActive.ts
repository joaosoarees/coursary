import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class AccountNotActive extends ApplicationError {
  readonly code = ErrorCode.AccountNotActive;
  readonly statusCode = 409;

  constructor() {
    super('The account is not active.');
    this.name = 'AccountNotActive';
  }
}
