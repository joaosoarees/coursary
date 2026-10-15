import type { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { lessonParamsSchema } from '@application/controllers/outline/outlineSchemas';
import { permissions } from '@application/security/permissions';
import type { DeleteLessonUseCase } from '@application/usecases/outline/DeleteLessonUseCase';

export class DeleteLessonController extends Controller<'private'> {
  protected override readonly permission = permissions.CoursesUpdate;

  protected override readonly paramsSchema = lessonParamsSchema;

  constructor(private readonly useCase: DeleteLessonUseCase) {
    super();
  }

  protected async handle({
    accountId,
    role,
    params,
  }: Controller.Request<
    'private',
    Record<string, unknown>,
    DeleteLessonController.Params
  >): Promise<Controller.Response<undefined>> {
    await this.useCase.execute({
      callerId: accountId,
      callerRole: role,
      courseId: params.id,
      moduleId: params.mid,
      lessonId: params.lid,
    });

    return { statusCode: 204 };
  }
}

export namespace DeleteLessonController {
  export type Params = z.infer<typeof lessonParamsSchema>;
}
