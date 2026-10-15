import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { accountIdParamsSchema } from '@application/controllers/admin/accountIdParamsSchema';
import { accountRoles } from '@application/entities/Account';
import { permissions } from '@application/security/permissions';
import type { ChangeRoleUseCase } from '@application/usecases/account/ChangeRoleUseCase';

export const changeRoleSchema = z.object({ role: z.enum(accountRoles) });

export class ChangeRoleController extends Controller<
  'private',
  ChangeRoleUseCase.Output
> {
  protected override readonly permission = permissions.UsersChangeRole;

  protected override readonly paramsSchema = accountIdParamsSchema;

  protected override readonly bodySchema = changeRoleSchema;

  constructor(private readonly changeRole: ChangeRoleUseCase) {
    super();
  }

  protected async handle({
    accountId,
    params,
    body,
  }: Controller.Request<
    'private',
    ChangeRoleController.Body,
    ChangeRoleController.Params
  >): Promise<Controller.Response<ChangeRoleUseCase.Output>> {
    const changed = await this.changeRole.execute({
      callerId: accountId,
      accountId: params.id,
      role: body.role,
    });

    return { statusCode: 200, body: changed };
  }
}

export namespace ChangeRoleController {
  export type Params = z.infer<typeof accountIdParamsSchema>;

  export type Body = z.infer<typeof changeRoleSchema>;
}
