import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class CourseNotPublished extends ApplicationError {
  readonly code = ErrorCode.CourseNotPublished;
  readonly statusCode = 409;

  constructor() {
    super('Only a published course can be archived.');
    this.name = 'CourseNotPublished';
  }
}
