import type { GetParameterCommand } from '@aws-sdk/client-ssm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { anAccountId } from '@tests/support/ids';

import { ssmClient } from '@infra/clients/ssmClient';
import { AlgoliaCatalogSearch } from '@infra/gateways/catalog/AlgoliaCatalogSearch';
import { AlgoliaConnection } from '@infra/gateways/catalog/AlgoliaConnection';
import { AppConfig } from '@shared/config/AppConfig';

interface SentRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: string | Uint8Array;
}

const parameters: Record<string, string> = {
  '/coursary-api/test/algolia/app-id': 'APPID',
  '/coursary-api/test/algolia/search-key': 'search-only',
};

const readParameter = (command: GetParameterCommand) =>
  Promise.resolve({
    Parameter: { Value: parameters[command.input.Name ?? ''] },
  });

beforeEach(() => {
  vi.stubEnv('ALGOLIA_PARAMETERS_PATH', '/coursary-api/test/algolia');
  vi.stubEnv('CATALOG_INDEX_NAME', 'test_courses');
  vi.spyOn(ssmClient, 'send').mockImplementation(readParameter as never);
});

describe('AlgoliaCatalogSearch', () => {
  it('should ask for ids only, from page and size as given, with the search key', async () => {
    const first = anAccountId();
    const second = anAccountId();
    const sent: SentRequest[] = [];
    const config = new AppConfig();
    const search = new AlgoliaCatalogSearch(
      config,
      new AlgoliaConnection(config, 'search-key', {
        requester: {
          send: (request: SentRequest) => {
            sent.push(request);

            return Promise.resolve({
              status: 200,
              content: JSON.stringify({
                hits: [
                  { objectID: second },
                  { objectID: 'not-a-course' },
                  { objectID: first },
                ],
                nbHits: 21,
                nbPages: 3,
                page: 1,
                hitsPerPage: 10,
              }),
              isTimedOut: false,
            });
          },
        },
      }),
    );

    await expect(
      search.search({ query: 'dynamo', page: 1, perPage: 10 }),
    ).resolves.toEqual({
      courseIds: [second, first],
      totalItems: 21,
      totalPages: 3,
    });

    expect(sent[0]?.url).toContain('/1/indexes/test_courses/query');
    expect(sent[0]?.headers['x-algolia-api-key']).toBe('search-only');
    expect(JSON.parse(String(sent[0]?.data))).toEqual({
      query: 'dynamo',
      page: 1,
      hitsPerPage: 10,
      attributesToRetrieve: [],
      attributesToHighlight: [],
    });
  });
});
