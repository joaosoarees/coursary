import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class CourseArchived extends ApplicationError {
  readonly code = ErrorCode.CourseArchived;
  readonly statusCode = 409;

  constructor() {
    super('An archived course cannot be changed.');
    this.name = 'CourseArchived';
  }
}
