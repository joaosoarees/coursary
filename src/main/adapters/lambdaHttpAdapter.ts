import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { ZodError } from 'zod';

import type { Controller } from '@application/contracts/Controller';
import { Account } from '@application/entities/Account';
import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';
import { InvalidSession } from '@application/errors/InvalidSession';
import { lambdaBodyParser } from '@main/utils/lambdaBodyParser';
import { lambdaErrorResponse } from '@main/utils/lambdaErrorResponse';

type Event = APIGatewayProxyEventV2 | APIGatewayProxyEventV2WithJWTAuthorizer;

export function lambdaHttpAdapter(
  controller: Controller<Controller.RouteType, unknown>,
) {
  return async (event: Event): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
      const caller = lambdaCaller(event);
      const body = lambdaBodyParser(
        event.body,
        event.isBase64Encoded,
      ) as Record<string, unknown>;
      const request = {
        ...caller,
        body,
        params: event.pathParameters ?? {},
        queryParams: event.queryStringParameters ?? {},
      };
      const { statusCode, body: responseBody } =
        await controller.execute(request);

      return {
        statusCode,
        headers: { 'content-type': 'application/json' },
        body:
          responseBody === undefined ? undefined : JSON.stringify(responseBody),
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return lambdaErrorResponse(
          400,
          ErrorCode.Validation,
          'The request is not valid.',
          error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        );
      }

      if (error instanceof ApplicationError) {
        return lambdaErrorResponse(error.statusCode, error.code, error.message);
      }

      console.error(
        JSON.stringify({
          requestId: event.requestContext.requestId,
          error:
            error instanceof Error
              ? { name: error.name, message: error.message, stack: error.stack }
              : String(error),
        }),
      );

      return lambdaErrorResponse(
        500,
        ErrorCode.InternalServerError,
        'Internal server error.',
      );
    }
  };
}

type Caller =
  { accountId: string; role: Account.Role } | { accountId: null; role: null };

function lambdaCaller(event: Event): Caller {
  if (!('authorizer' in event.requestContext)) {
    return { accountId: null, role: null };
  }

  const { internalId, role } = event.requestContext.authorizer.jwt.claims;

  if (typeof internalId !== 'string' || internalId === '') {
    throw new InvalidSession();
  }

  if (!Account.isRole(role)) {
    throw new InvalidSession();
  }

  return { accountId: internalId, role };
}
