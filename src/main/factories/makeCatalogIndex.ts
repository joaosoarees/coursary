import type { CatalogIndex } from '@application/gateways/catalog/CatalogIndex';
import { AlgoliaCatalogIndex } from '@infra/gateways/catalog/AlgoliaCatalogIndex';
import { makeAppConfig } from '@main/factories/makeAppConfig';

export function makeCatalogIndex(): CatalogIndex {
  const appConfig = makeAppConfig();

  return new AlgoliaCatalogIndex(appConfig);
}
