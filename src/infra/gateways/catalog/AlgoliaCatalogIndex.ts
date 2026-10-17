import { type Algoliasearch, algoliasearch } from 'algoliasearch';

import type { Course } from '@application/entities/course/Course';
import type { CatalogIndex } from '@application/gateways/catalog/CatalogIndex';
import { SecureParameter } from '@infra/clients/SecureParameter';
import type { AppConfig } from '@shared/config/AppConfig';

export class AlgoliaCatalogIndex implements CatalogIndex {
  private client: Promise<Algoliasearch> | undefined;

  constructor(
    private readonly config: AppConfig,
    private readonly options?: Parameters<typeof algoliasearch>[2],
  ) {}

  // The objectID is the course id, so saving twice rewrites one record.
  async save(record: CatalogIndex.Record): Promise<void> {
    const client = await this.connect();
    await client.saveObject({
      indexName: this.config.catalogIndexName,
      body: {
        objectID: record.courseId,
        title: record.title,
        description: record.description,
        instructorName: record.instructorName,
        publishedAt: record.publishedAt,
      },
    });
  }

  async remove(courseId: Course.Id): Promise<void> {
    const client = await this.connect();
    await client.deleteObject({
      indexName: this.config.catalogIndexName,
      objectID: courseId,
    });
  }

  private connect(): Promise<Algoliasearch> {
    this.client ??= this.createClient();

    return this.client;
  }

  private async createClient(): Promise<Algoliasearch> {
    const path = this.config.algoliaParametersPath;

    try {
      const [appId, writeKey] = await Promise.all([
        new SecureParameter(`${path}/app-id`).get(),
        new SecureParameter(`${path}/write-key`).get(),
      ]);

      return algoliasearch(appId, writeKey, this.options);
    } catch (error) {
      // The next message reads the keys again.
      this.client = undefined;
      throw error;
    }
  }
}
