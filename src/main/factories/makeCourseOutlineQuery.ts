import type { CourseOutlineQuery } from '@application/queries/CourseOutlineQuery';
import { DynamoCourseOutlineQuery } from '@infra/database/dynamo/queries/DynamoCourseOutlineQuery';
import { makeAppConfig } from '@main/factories/makeAppConfig';

export function makeCourseOutlineQuery(): CourseOutlineQuery {
  const appConfig = makeAppConfig();

  return new DynamoCourseOutlineQuery(appConfig);
}
