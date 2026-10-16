import { z } from 'zod';

import {
  courseIdSchema,
  lessonIdSchema,
} from '@application/controllers/shared/schemas';

export const openLessonParamsSchema = z.object({
  courseId: courseIdSchema,
  lessonId: lessonIdSchema,
});
