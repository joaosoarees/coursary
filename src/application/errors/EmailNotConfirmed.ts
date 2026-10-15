import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class EmailNotConfirmed extends ApplicationError {
  readonly code = ErrorCode.EmailNotConfirmed;
  readonly statusCode = 403;

  constructor() {
    super('Confirm your e-mail address before signing in.');
    this.name = 'EmailNotConfirmed';
  }
}
