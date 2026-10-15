import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class CannotChangeOwnStatus extends ApplicationError {
  readonly code = ErrorCode.CannotChangeOwnStatus;
  readonly statusCode = 403;

  constructor() {
    super('You cannot change the status of your own account.');
    this.name = 'CannotChangeOwnStatus';
  }
}
