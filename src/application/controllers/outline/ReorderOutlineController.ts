import type { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { outlineBodySchema } from '@application/controllers/outline/schemas';
import { courseIdParamsSchema } from '@application/controllers/shared/schemas';
import type { CourseOutlineQuery } from '@application/queries/outline/CourseOutlineQuery';
import { permissions } from '@application/security/permissions';
import type { ReorderOutlineUseCase } from '@application/usecases/outline/ReorderOutlineUseCase';

export class ReorderOutlineController extends Controller<
  'private',
  CourseOutlineQuery.Outline
> {
  protected override readonly permission = permissions.CoursesUpdate;

  protected override readonly paramsSchema = courseIdParamsSchema;

  protected override readonly bodySchema = outlineBodySchema;

  constructor(private readonly reorderOutline: ReorderOutlineUseCase) {
    super();
  }

  protected async handle({
    accountId,
    role,
    params,
    body,
  }: Controller.Request<
    'private',
    ReorderOutlineController.Body,
    ReorderOutlineController.Params
  >): Promise<Controller.Response<CourseOutlineQuery.Outline>> {
    const result = await this.reorderOutline.execute({
      callerId: accountId,
      callerRole: role,
      courseId: params.id,
      modules: body.modules,
    });

    return { statusCode: 200, body: result };
  }
}

export namespace ReorderOutlineController {
  export type Params = z.infer<typeof courseIdParamsSchema>;

  export type Body = z.infer<typeof outlineBodySchema>;
}
