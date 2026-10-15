import { ListCatalogController } from '@application/controllers/catalog/ListCatalogController';
import { ListCatalogUseCase } from '@application/usecases/catalog/ListCatalogUseCase';
import { makeCatalogQuery } from '@main/factories/makeCatalogQuery';

export function makeListCatalogController(): ListCatalogController {
  const catalogQuery = makeCatalogQuery();
  const listCatalogUseCase = new ListCatalogUseCase(catalogQuery);

  return new ListCatalogController(listCatalogUseCase);
}
