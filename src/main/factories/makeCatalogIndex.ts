import type { CatalogIndex } from '@application/gateways/catalog/CatalogIndex';
import { SecureParameter } from '@infra/clients/SecureParameter';
import { AlgoliaCatalogIndex } from '@infra/gateways/catalog/AlgoliaCatalogIndex';
import { makeAppConfig } from '@main/factories/makeAppConfig';

export function makeCatalogIndex(): CatalogIndex {
  const appConfig = makeAppConfig();
  const path = appConfig.algoliaParametersPath;

  return new AlgoliaCatalogIndex(
    appConfig.catalogIndexName,
    new SecureParameter(`${path}/app-id`),
    new SecureParameter(`${path}/write-key`),
  );
}
