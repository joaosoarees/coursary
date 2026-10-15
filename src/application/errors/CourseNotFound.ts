import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class CourseNotFound extends ApplicationError {
  readonly code = ErrorCode.CourseNotFound;
  readonly statusCode = 404;

  constructor() {
    super('The course does not exist.');
    this.name = 'CourseNotFound';
  }
}
