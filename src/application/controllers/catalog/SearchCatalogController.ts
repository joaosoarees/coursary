import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import type { SearchCatalogUseCase } from '@application/usecases/catalog/SearchCatalogUseCase';

// Pages count from 0 (Q297); Algolia pages only reach the first 1,000 hits (Q327).
export const searchSchema = z.object({
  q: z.string().trim().min(1).max(200),
  page: z.coerce.number().int().min(0).max(49).default(0),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
});

export class SearchCatalogController extends Controller<
  'public',
  SearchCatalogUseCase.Output
> {
  protected override readonly queryParamsSchema = searchSchema;

  constructor(private readonly searchCatalog: SearchCatalogUseCase) {
    super();
  }

  protected async handle({
    queryParams,
  }: Controller.Request<
    'public',
    Record<string, unknown>,
    Record<string, unknown>,
    SearchCatalogController.QueryParams
  >): Promise<Controller.Response<SearchCatalogUseCase.Output>> {
    const { q, page, perPage } = queryParams;
    const result = await this.searchCatalog.execute({
      query: q,
      page,
      perPage,
    });

    return { statusCode: 200, body: result };
  }
}

export namespace SearchCatalogController {
  export type QueryParams = z.infer<typeof searchSchema>;
}
