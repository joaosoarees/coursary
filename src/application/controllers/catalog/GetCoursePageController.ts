import type { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { courseIdParamsSchema } from '@application/controllers/course/courseSchemas';
import type { CoursePageQuery } from '@application/queries/CoursePageQuery';
import type { GetCoursePageUseCase } from '@application/usecases/catalog/GetCoursePageUseCase';

export class GetCoursePageController extends Controller<
  'public',
  CoursePageQuery.Page
> {
  protected override readonly paramsSchema = courseIdParamsSchema;

  constructor(private readonly getCoursePage: GetCoursePageUseCase) {
    super();
  }

  protected async handle({
    params,
  }: Controller.Request<
    'public',
    Record<string, unknown>,
    GetCoursePageController.Params
  >): Promise<Controller.Response<CoursePageQuery.Page>> {
    const page = await this.getCoursePage.execute({ courseId: params.id });

    return { statusCode: 200, body: page };
  }
}

export namespace GetCoursePageController {
  export type Params = z.infer<typeof courseIdParamsSchema>;
}
