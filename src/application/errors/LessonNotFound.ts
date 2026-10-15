import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class LessonNotFound extends ApplicationError {
  readonly code = ErrorCode.LessonNotFound;
  readonly statusCode = 404;

  constructor() {
    super('The lesson does not exist.');
    this.name = 'LessonNotFound';
  }
}
