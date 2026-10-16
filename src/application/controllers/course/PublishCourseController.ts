import type { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { courseIdParamsSchema } from '@application/controllers/course/schemas';
import { permissions } from '@application/security/permissions';
import type { CourseDetails } from '@application/usecases/course/CourseDetails';
import type { PublishCourseUseCase } from '@application/usecases/course/PublishCourseUseCase';

export class PublishCourseController extends Controller<
  'private',
  CourseDetails
> {
  protected override readonly permission = permissions.CoursesPublish;

  protected override readonly paramsSchema = courseIdParamsSchema;

  constructor(private readonly useCase: PublishCourseUseCase) {
    super();
  }

  protected async handle({
    accountId,
    role,
    params,
  }: Controller.Request<
    'private',
    Record<string, unknown>,
    PublishCourseController.Params
  >): Promise<Controller.Response<CourseDetails>> {
    const course = await this.useCase.execute({
      callerId: accountId,
      callerRole: role,
      courseId: params.id,
    });

    return { statusCode: 200, body: course };
  }
}

export namespace PublishCourseController {
  export type Params = z.infer<typeof courseIdParamsSchema>;
}
