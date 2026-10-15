import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class ModuleNotEmpty extends ApplicationError {
  readonly code = ErrorCode.ModuleNotEmpty;
  readonly statusCode = 409;

  constructor() {
    super('Delete the lessons of the module first.');
    this.name = 'ModuleNotEmpty';
  }
}
