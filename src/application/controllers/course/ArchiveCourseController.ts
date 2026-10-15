import type { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { courseIdParamsSchema } from '@application/controllers/course/courseSchemas';
import { permissions } from '@application/security/permissions';
import type { ArchiveCourseUseCase } from '@application/usecases/course/ArchiveCourseUseCase';
import type { CourseDetails } from '@application/usecases/course/CourseDetails';

export class ArchiveCourseController extends Controller<
  'private',
  CourseDetails
> {
  protected override readonly permission = permissions.CoursesArchive;

  protected override readonly paramsSchema = courseIdParamsSchema;

  constructor(private readonly useCase: ArchiveCourseUseCase) {
    super();
  }

  protected async handle({
    accountId,
    role,
    params,
  }: Controller.Request<
    'private',
    Record<string, unknown>,
    ArchiveCourseController.Params
  >): Promise<Controller.Response<CourseDetails>> {
    const course = await this.useCase.execute({
      callerId: accountId,
      callerRole: role,
      courseId: params.id,
    });

    return { statusCode: 200, body: course };
  }
}

export namespace ArchiveCourseController {
  export type Params = z.infer<typeof courseIdParamsSchema>;
}
