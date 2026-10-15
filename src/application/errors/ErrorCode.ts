export const ErrorCode = {
  InternalServerError: 'INTERNAL_SERVER_ERROR',
  BadRequest: 'BAD_REQUEST',
  Validation: 'VALIDATION',
  EmailInUse: 'EMAIL_IN_USE',
  InvalidPassword: 'INVALID_PASSWORD',
  InvalidCode: 'INVALID_CODE',
  AccountUnavailable: 'ACCOUNT_UNAVAILABLE',
  InvalidCredentials: 'INVALID_CREDENTIALS',
  EmailNotConfirmed: 'EMAIL_NOT_CONFIRMED',
  InvalidSession: 'INVALID_SESSION',
  Forbidden: 'FORBIDDEN',
  InvalidCursor: 'INVALID_CURSOR',
  AccountNotFound: 'ACCOUNT_NOT_FOUND',
  AccountNotActive: 'ACCOUNT_NOT_ACTIVE',
  CannotChangeOwnRole: 'CANNOT_CHANGE_OWN_ROLE',
  CannotChangeOwnStatus: 'CANNOT_CHANGE_OWN_STATUS',
  Conflict: 'CONFLICT',
  TooManyRequests: 'TOO_MANY_REQUESTS',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
