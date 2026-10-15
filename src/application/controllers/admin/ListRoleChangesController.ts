import type { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import type { Page } from '@application/contracts/Page';
import { accountIdParamsSchema } from '@application/controllers/admin/accountIdParamsSchema';
import { paginationSchema } from '@application/controllers/paginationSchema';
import type { RoleChangeSummary } from '@application/queries/RoleChangeSummary';
import { permissions } from '@application/security/permissions';
import type { ListRoleChangesUseCase } from '@application/usecases/account/ListRoleChangesUseCase';

export class ListRoleChangesController extends Controller<
  'private',
  Page<RoleChangeSummary>
> {
  protected override readonly permission = permissions.UsersRead;

  protected override readonly paramsSchema = accountIdParamsSchema;

  protected override readonly queryParamsSchema = paginationSchema;

  constructor(private readonly listRoleChanges: ListRoleChangesUseCase) {
    super();
  }

  protected async handle({
    params,
    queryParams,
  }: Controller.Request<
    'private',
    Record<string, unknown>,
    ListRoleChangesController.Params,
    ListRoleChangesController.QueryParams
  >): Promise<Controller.Response<Page<RoleChangeSummary>>> {
    const page = await this.listRoleChanges.execute({
      accountId: params.id,
      ...queryParams,
    });

    return { statusCode: 200, body: page };
  }
}

export namespace ListRoleChangesController {
  export type Params = z.infer<typeof accountIdParamsSchema>;

  export type QueryParams = z.infer<typeof paginationSchema>;
}
