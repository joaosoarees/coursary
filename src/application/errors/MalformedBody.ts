import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class MalformedBody extends ApplicationError {
  readonly code = ErrorCode.BadRequest;
  readonly statusCode = 400;

  constructor() {
    super('The request body is not valid JSON.');
    this.name = 'MalformedBody';
  }
}
