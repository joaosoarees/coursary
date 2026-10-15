import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { EmailInUse } from '@application/errors/EmailInUse';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

const makeEvent = (body?: string, isBase64Encoded = false) =>
  ({
    body,
    isBase64Encoded,
    requestContext: { requestId: 'request-1' },
  }) as APIGatewayProxyEventV2;

const parseBody = (body: string | undefined): unknown => JSON.parse(body ?? '');

class OkController extends Controller<'public', { status: string }> {
  protected handle() {
    return Promise.resolve({ statusCode: 200, body: { status: 'ok' } });
  }
}

class NoContentController extends Controller<'public'> {
  protected handle() {
    return Promise.resolve({ statusCode: 204 });
  }
}

class FailingController extends Controller<'public'> {
  protected handle(): Promise<never> {
    return Promise.reject(new Error('table is gone'));
  }
}

class EmailInUseController extends Controller<'public'> {
  protected handle(): Promise<never> {
    return Promise.reject(new EmailInUse());
  }
}

class EchoController extends Controller<'public', { name: string }> {
  protected override readonly bodySchema = z.object({
    name: z.string().min(1),
  });

  protected handle(request: Controller.Request<'public', { name: string }>) {
    return Promise.resolve({ statusCode: 200, body: request.body });
  }
}

describe('lambdaHttpAdapter', () => {
  it('should return the status code and the body as JSON', async () => {
    const response = await lambdaHttpAdapter(new OkController())(makeEvent());

    expect(response).toEqual({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"status":"ok"}',
    });
  });

  it('should leave the body out when the controller returns none', async () => {
    const response = await lambdaHttpAdapter(new NoContentController())(
      makeEvent(),
    );

    expect(response.statusCode).toBe(204);
    expect(response.body).toBeUndefined();
  });

  it('should pass the parsed and validated body to the controller', async () => {
    const response = await lambdaHttpAdapter(new EchoController())(
      makeEvent('{"name":"Ana","extra":true}'),
    );

    expect(parseBody(response.body)).toEqual({ name: 'Ana' });
  });

  it('should decode a body the API delivers in base64', async () => {
    const response = await lambdaHttpAdapter(new EchoController())(
      makeEvent(Buffer.from('{"name":"Ana"}').toString('base64'), true),
    );

    expect(parseBody(response.body)).toEqual({ name: 'Ana' });
  });

  it('should answer 400 VALIDATION with the failing fields', async () => {
    const response = await lambdaHttpAdapter(new EchoController())(
      makeEvent('{"name":""}'),
    );

    expect(response.statusCode).toBe(400);
    expect(parseBody(response.body)).toMatchObject({
      error: { code: 'VALIDATION', details: [{ field: 'name' }] },
    });
  });

  it('should answer 400 BAD_REQUEST when the body is not JSON', async () => {
    const response = await lambdaHttpAdapter(new EchoController())(
      makeEvent('{name'),
    );

    expect(response.statusCode).toBe(400);
    expect(parseBody(response.body)).toMatchObject({
      error: { code: 'BAD_REQUEST' },
    });
  });

  it('should answer an application error with its own status and code', async () => {
    const response = await lambdaHttpAdapter(new EmailInUseController())(
      makeEvent(),
    );

    expect(response.statusCode).toBe(409);
    expect(parseBody(response.body)).toEqual({
      error: {
        code: 'EMAIL_IN_USE',
        message: 'This e-mail address is already registered.',
      },
    });
  });

  it('should answer 500 without the error message when the controller throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await lambdaHttpAdapter(new FailingController())(
      makeEvent(),
    );

    expect(response.statusCode).toBe(500);
    expect(parseBody(response.body)).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error.',
      },
    });
  });

  it('should log the request id and the error when the controller throws', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await lambdaHttpAdapter(new FailingController())(makeEvent());

    const entry = JSON.parse(String(log.mock.calls[0]?.[0])) as {
      requestId: string;
      error: { message: string };
    };
    expect(entry.requestId).toBe('request-1');
    expect(entry.error.message).toBe('table is gone');
  });
});
