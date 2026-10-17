import { type Algoliasearch, algoliasearch } from 'algoliasearch';

import type { Course } from '@application/entities/course/Course';
import type { CatalogIndex } from '@application/gateways/catalog/CatalogIndex';
import type { SecureParameter } from '@infra/clients/SecureParameter';

export class AlgoliaCatalogIndex implements CatalogIndex {
  private client: Promise<Algoliasearch> | undefined;

  constructor(
    private readonly indexName: string,
    private readonly appId: SecureParameter,
    private readonly writeKey: SecureParameter,
    private readonly options?: Parameters<typeof algoliasearch>[2],
  ) {}

  // The objectID is the course id, so saving twice rewrites one record.
  async save(record: CatalogIndex.Record): Promise<void> {
    const client = await this.connect();
    await client.saveObject({
      indexName: this.indexName,
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
      indexName: this.indexName,
      objectID: courseId,
    });
  }

  private connect(): Promise<Algoliasearch> {
    this.client ??= Promise.all([this.appId.get(), this.writeKey.get()]).then(
      ([appId, writeKey]) => algoliasearch(appId, writeKey, this.options),
      (error: unknown) => {
        this.client = undefined;
        throw error;
      },
    );

    return this.client;
  }
}
