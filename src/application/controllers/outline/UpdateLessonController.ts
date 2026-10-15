import type { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import {
  lessonParamsSchema,
  updateLessonSchema,
} from '@application/controllers/outline/outlineSchemas';
import { permissions } from '@application/security/permissions';
import type { LessonDetails } from '@application/usecases/outline/LessonDetails';
import type { UpdateLessonUseCase } from '@application/usecases/outline/UpdateLessonUseCase';

export class UpdateLessonController extends Controller<
  'private',
  LessonDetails
> {
  protected override readonly permission = permissions.CoursesUpdate;

  protected override readonly paramsSchema = lessonParamsSchema;

  protected override readonly bodySchema = updateLessonSchema;

  constructor(private readonly useCase: UpdateLessonUseCase) {
    super();
  }

  protected async handle({
    accountId,
    role,
    params,
    body,
  }: Controller.Request<
    'private',
    UpdateLessonController.Body,
    UpdateLessonController.Params
  >): Promise<Controller.Response<LessonDetails>> {
    const result = await this.useCase.execute({
      callerId: accountId,
      callerRole: role,
      courseId: params.id,
      moduleId: params.mid,
      lessonId: params.lid,
      changes: body,
    });

    return { statusCode: 200, body: result };
  }
}

export namespace UpdateLessonController {
  export type Params = z.infer<typeof lessonParamsSchema>;

  export type Body = z.infer<typeof updateLessonSchema>;
}
