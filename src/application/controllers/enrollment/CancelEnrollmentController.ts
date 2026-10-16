import type { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { courseIdParamsSchema } from '@application/controllers/course/schemas';
import { permissions } from '@application/security/permissions';
import type { CancelEnrollmentUseCase } from '@application/usecases/enrollment/CancelEnrollmentUseCase';

export class CancelEnrollmentController extends Controller<'private'> {
  protected override readonly permission = permissions.CoursesEnroll;

  protected override readonly paramsSchema = courseIdParamsSchema;

  constructor(private readonly useCase: CancelEnrollmentUseCase) {
    super();
  }

  protected async handle({
    accountId,
    params,
  }: Controller.Request<
    'private',
    Record<string, unknown>,
    CancelEnrollmentController.Params
  >): Promise<Controller.Response<undefined>> {
    await this.useCase.execute({ callerId: accountId, courseId: params.id });

    return { statusCode: 204 };
  }
}

export namespace CancelEnrollmentController {
  export type Params = z.infer<typeof courseIdParamsSchema>;
}
