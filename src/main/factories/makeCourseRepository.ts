import type { CourseRepository } from '@application/repositories/CourseRepository';
import { DynamoCourseRepository } from '@infra/database/dynamo/repositories/DynamoCourseRepository';
import { makeAppConfig } from '@main/factories/makeAppConfig';

export function makeCourseRepository(): CourseRepository {
  const appConfig = makeAppConfig();

  return new DynamoCourseRepository(appConfig);
}
