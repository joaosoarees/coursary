import type { Page } from '@application/contracts/Page';
import type { CatalogQuery } from '@application/queries/catalog/CatalogQuery';

export class ListCatalogUseCase {
  constructor(private readonly catalog: CatalogQuery) {}

  execute(page: ListCatalogUseCase.Input): Promise<Page<CatalogQuery.Item>> {
    return this.catalog.execute(page);
  }
}

export namespace ListCatalogUseCase {
  export type Input = Page.Options;
}
