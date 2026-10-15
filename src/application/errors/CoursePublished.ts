import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class CoursePublished extends ApplicationError {
  readonly code = ErrorCode.CoursePublished;
  readonly statusCode = 409;

  constructor() {
    super('A published course keeps its modules and lessons.');
    this.name = 'CoursePublished';
  }
}
