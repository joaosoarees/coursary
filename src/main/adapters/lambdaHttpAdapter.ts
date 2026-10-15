import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { ZodError } from 'zod';

import type { Controller } from '@application/contracts/Controller';
import { ApplicationError } from '@application/errors/ApplicationError';
import { ErrorCode } from '@application/errors/ErrorCode';
import { lambdaBodyParser } from '@main/utils/lambdaBodyParser';
import { lambdaErrorResponse } from '@main/utils/lambdaErrorResponse';

export function lambdaHttpAdapter(
  controller: Controller<Controller.RouteType, unknown>,
) {
  return async (
    event: APIGatewayProxyEventV2,
  ): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
      const body = lambdaBodyParser(
        event.body,
        event.isBase64Encoded,
      ) as Record<string, unknown>;
      const { statusCode, body: responseBody } = await controller.execute({
        body,
      });

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
