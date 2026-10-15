import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';

import { Controller } from '@application/contracts/Controller';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const event = {
  requestContext: { requestId: 'request-1' },
} as APIGatewayProxyEventV2;

class OkController extends Controller<{ status: string }> {
  handle() {
    return Promise.resolve({ statusCode: 200, body: { status: 'ok' } });
  }
}

class NoContentController extends Controller {
  handle() {
    return Promise.resolve({ statusCode: 204 });
  }
}

class FailingController extends Controller {
  handle(): Promise<never> {
    return Promise.reject(new Error('table is gone'));
  }
}

describe('lambdaHttpAdapter', () => {
  it('should return the status code and the body as JSON', async () => {
    const response = await lambdaHttpAdapter(new OkController())(event);

    expect(response).toEqual({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"status":"ok"}',
    });
  });

  it('should leave the body out when the controller returns none', async () => {
    const response = await lambdaHttpAdapter(new NoContentController())(event);

    expect(response.statusCode).toBe(204);
    expect(response.body).toBeUndefined();
  });

  it('should answer 500 without the error message when the controller throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await lambdaHttpAdapter(new FailingController())(event);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body ?? '')).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error.',
      },
    });
  });

  it('should log the request id and the error when the controller throws', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await lambdaHttpAdapter(new FailingController())(event);

    const entry = JSON.parse(String(log.mock.calls[0]?.[0])) as {
      requestId: string;
      error: { message: string };
    };
    expect(entry.requestId).toBe('request-1');
    expect(entry.error.message).toBe('table is gone');
  });
});
