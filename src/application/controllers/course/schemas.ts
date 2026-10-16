import { z } from 'zod';

import { Course } from '@application/entities/course/Course';
import { KSUID_PATTERN } from '@application/entities/shared/ksuid';

const titleSchema = z.string().trim().min(3).max(120);
const descriptionSchema = z.string().max(5000);

export const createCourseSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.default(''),
});

export const updateCourseSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .refine(
    (changes) =>
      changes.title !== undefined || changes.description !== undefined,
    { message: 'Send a title, a description or both.' },
  );

export const courseIdParamsSchema = z.object({
  id: z
    .string()
    .regex(KSUID_PATTERN)
    .transform((value) => Course.toId(value)),
});
