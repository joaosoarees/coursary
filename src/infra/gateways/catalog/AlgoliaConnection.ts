import { type Algoliasearch, algoliasearch } from 'algoliasearch';

import { SecureParameter } from '@infra/clients/SecureParameter';
import type { AppConfig } from '@shared/config/AppConfig';

// One client per container, built once its keys were read (Q305); a failure is retried by the next call.
export class AlgoliaConnection {
  private client: Algoliasearch | undefined;

  constructor(
    private readonly config: AppConfig,
    // `write-key` for the indexer, `search-key` for the search route (Q303).
    private readonly keyName: 'write-key' | 'search-key',
    private readonly options?: Parameters<typeof algoliasearch>[2],
  ) {}

  async get(): Promise<Algoliasearch> {
    if (!this.client) {
      const path = this.config.algoliaParametersPath;
      const [appId, apiKey] = await Promise.all([
        new SecureParameter(`${path}/app-id`).get(),
        new SecureParameter(`${path}/${this.keyName}`).get(),
      ]);
      this.client = algoliasearch(appId, apiKey, this.options);
    }

    return this.client;
  }
}
