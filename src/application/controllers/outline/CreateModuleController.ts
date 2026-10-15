import type { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import {
  moduleBodySchema,
  outlineParamsSchema,
} from '@application/controllers/outline/outlineSchemas';
import { permissions } from '@application/security/permissions';
import type { CreateModuleUseCase } from '@application/usecases/outline/CreateModuleUseCase';
import type { ModuleDetails } from '@application/usecases/outline/ModuleDetails';

export class CreateModuleController extends Controller<
  'private',
  ModuleDetails
> {
  protected override readonly permission = permissions.CoursesUpdate;

  protected override readonly paramsSchema = outlineParamsSchema;

  protected override readonly bodySchema = moduleBodySchema;

  constructor(private readonly useCase: CreateModuleUseCase) {
    super();
  }

  protected async handle({
    accountId,
    role,
    params,
    body,
  }: Controller.Request<
    'private',
    CreateModuleController.Body,
    CreateModuleController.Params
  >): Promise<Controller.Response<ModuleDetails>> {
    const result = await this.useCase.execute({
      callerId: accountId,
      callerRole: role,
      courseId: params.id,
      title: body.title,
    });

    return { statusCode: 201, body: result };
  }
}

export namespace CreateModuleController {
  export type Params = z.infer<typeof outlineParamsSchema>;

  export type Body = z.infer<typeof moduleBodySchema>;
}
