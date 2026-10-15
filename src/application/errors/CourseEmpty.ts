import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';

export class CourseEmpty extends ApplicationError {
  readonly code = ErrorCode.CourseEmpty;
  readonly statusCode = 409;

  constructor() {
    super('A course needs at least one lesson to be published.');
    this.name = 'CourseEmpty';
  }
}
