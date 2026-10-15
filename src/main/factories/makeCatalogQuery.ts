import type { CatalogQuery } from '@application/queries/CatalogQuery';
import { DynamoCatalogQuery } from '@infra/database/dynamo/queries/DynamoCatalogQuery';
import { makeAppConfig } from '@main/factories/makeAppConfig';

export function makeCatalogQuery(): CatalogQuery {
  const appConfig = makeAppConfig();

  return new DynamoCatalogQuery(appConfig);
}
