import type { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { outlineParamsSchema } from '@application/controllers/outline/schemas';
import type { CourseOutlineQuery } from '@application/queries/outline/CourseOutlineQuery';
import { permissions } from '@application/security/permissions';
import type { GetCourseOutlineUseCase } from '@application/usecases/outline/GetCourseOutlineUseCase';

export class GetCourseOutlineController extends Controller<
  'private',
  CourseOutlineQuery.Outline
> {
  protected override readonly permission = permissions.CoursesUpdate;

  protected override readonly paramsSchema = outlineParamsSchema;

  constructor(private readonly getCourseOutline: GetCourseOutlineUseCase) {
    super();
  }

  protected async handle({
    accountId,
    role,
    params,
  }: Controller.Request<
    'private',
    Record<string, unknown>,
    GetCourseOutlineController.Params
  >): Promise<Controller.Response<CourseOutlineQuery.Outline>> {
    const result = await this.getCourseOutline.execute({
      callerId: accountId,
      callerRole: role,
      courseId: params.id,
    });

    return { statusCode: 200, body: result };
  }
}

export namespace GetCourseOutlineController {
  export type Params = z.infer<typeof outlineParamsSchema>;
}
