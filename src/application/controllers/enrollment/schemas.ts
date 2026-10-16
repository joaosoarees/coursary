import { z } from 'zod';

import {
  courseIdSchema,
  lessonIdSchema,
} from '@application/controllers/shared/schemas';

export const lessonParamsSchema = z.object({
  courseId: courseIdSchema,
  lessonId: lessonIdSchema,
});
