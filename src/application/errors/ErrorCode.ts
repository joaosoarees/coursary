export const ErrorCode = {
  InternalServerError: 'INTERNAL_SERVER_ERROR',
  EmailInUse: 'EMAIL_IN_USE',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
