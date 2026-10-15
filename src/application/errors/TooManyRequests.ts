import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class TooManyRequests extends ApplicationError {
  readonly code = ErrorCode.TooManyRequests;
  readonly statusCode = 429;

  constructor() {
    super('Too many attempts. Try again later.');
    this.name = 'TooManyRequests';
  }
}
