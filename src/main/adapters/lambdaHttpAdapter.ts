import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

import type { Controller } from '@application/contracts/Controller';
import { ErrorCode } from '@application/errors/ErrorCode';
import { lambdaErrorResponse } from '@main/utils/lambdaErrorResponse';

export function lambdaHttpAdapter(controller: Controller<unknown>) {
  return async (
    event: APIGatewayProxyEventV2,
  ): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
      const { statusCode, body } = await controller.handle();

      return {
        statusCode,
        headers: { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      };
    } catch (error) {
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
