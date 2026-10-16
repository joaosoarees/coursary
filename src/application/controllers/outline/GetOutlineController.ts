import type { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { outlineParamsSchema } from '@application/controllers/outline/schemas';
import type { CourseOutlineQuery } from '@application/queries/outline/CourseOutlineQuery';
import { permissions } from '@application/security/permissions';
import type { GetCourseOutlineUseCase } from '@application/usecases/outline/GetCourseOutlineUseCase';

export class GetOutlineController extends Controller<
  'private',
  CourseOutlineQuery.Outline
> {
  protected override readonly permission = permissions.CoursesUpdate;

  protected override readonly paramsSchema = outlineParamsSchema;

  constructor(private readonly useCase: GetCourseOutlineUseCase) {
    super();
  }

  protected async handle({
    accountId,
    role,
    params,
  }: Controller.Request<
    'private',
    Record<string, unknown>,
    GetOutlineController.Params
  >): Promise<Controller.Response<CourseOutlineQuery.Outline>> {
    const result = await this.useCase.execute({
      callerId: accountId,
      callerRole: role,
      courseId: params.id,
    });

    return { statusCode: 200, body: result };
  }
}

export namespace GetOutlineController {
  export type Params = z.infer<typeof outlineParamsSchema>;
}
