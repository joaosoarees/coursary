import type { CoursePageQuery } from '@application/queries/CoursePageQuery';
import { DynamoCoursePageQuery } from '@infra/database/dynamo/queries/DynamoCoursePageQuery';
import { makeAppConfig } from '@main/factories/makeAppConfig';

export function makeCoursePageQuery(): CoursePageQuery {
  const appConfig = makeAppConfig();

  return new DynamoCoursePageQuery(appConfig);
}
