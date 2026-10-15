import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class ModuleNotFound extends ApplicationError {
  readonly code = ErrorCode.ModuleNotFound;
  readonly statusCode = 404;

  constructor() {
    super('The module does not exist.');
    this.name = 'ModuleNotFound';
  }
}
