import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type {
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

interface FunctionDefinition {
  handler: string;
  events?: {
    httpApi?: { method: string; path: string; authorizer?: string };
  }[];
}

type Handler = (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) => Promise<APIGatewayProxyStructuredResultV2>;

const root = path.resolve(import.meta.dirname, '../../..');
const functionsDir = path.join(root, 'sls/functions');

const adminRoutes = readdirSync(functionsDir)
  .filter((file) => file.endsWith('.yml'))
  .flatMap((file) => {
    const definitions = parse(
      readFileSync(path.join(functionsDir, file), 'utf8'),
    ) as Record<string, FunctionDefinition>;

    return Object.entries(definitions).flatMap(([name, definition]) =>
      (definition.events ?? [])
        .map((event) => event.httpApi)
        .filter((httpApi) => httpApi?.path.startsWith('/admin'))
        .map((httpApi) => ({ name, handler: definition.handler, httpApi })),
    );
  });

const studentEvent = {
  isBase64Encoded: false,
  requestContext: {
    requestId: 'audit',
    authorizer: {
      jwt: { claims: { internalId: 'acc-1', role: 'student' }, scopes: [] },
    },
  },
} as unknown as APIGatewayProxyEventV2WithJWTAuthorizer;

describe('admin routes', () => {
  it('should exist', () => {
    expect(adminRoutes.length).toBeGreaterThan(0);
  });

  it.each(adminRoutes)(
    '$httpApi.method $httpApi.path should require a token and refuse a student',
    async ({ handler, httpApi }) => {
      const [file = '', exportName = ''] = handler.split(/\.(?=[^.]+$)/);
      const module = (await import(path.join(root, `${file}.ts`))) as Record<
        string,
        Handler
      >;

      const response = await module[exportName]?.(studentEvent);

      expect(httpApi?.authorizer).toBe('CognitoAuthorizer');
      expect(response?.statusCode).toBe(403);
    },
  );
});
