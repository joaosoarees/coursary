import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class InvalidPassword extends ApplicationError {
  readonly code = ErrorCode.InvalidPassword;
  readonly statusCode = 400;

  constructor() {
    super('The password does not meet the password policy.');
    this.name = 'InvalidPassword';
  }
}
