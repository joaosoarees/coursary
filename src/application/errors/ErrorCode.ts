export const ErrorCode = {
  InternalServerError: 'INTERNAL_SERVER_ERROR',
  BadRequest: 'BAD_REQUEST',
  Validation: 'VALIDATION',
  EmailInUse: 'EMAIL_IN_USE',
  InvalidPassword: 'INVALID_PASSWORD',
  TooManyRequests: 'TOO_MANY_REQUESTS',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
