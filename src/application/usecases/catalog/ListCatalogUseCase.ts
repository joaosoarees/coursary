import type { Page } from '@application/contracts/Page';
import type { CatalogQuery } from '@application/queries/CatalogQuery';

export class ListCatalogUseCase {
  constructor(private readonly catalog: CatalogQuery) {}

  execute(page: Page.Options): Promise<Page<CatalogQuery.Item>> {
    return this.catalog.execute(page);
  }
}
