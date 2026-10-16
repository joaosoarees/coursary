import { z } from 'zod';

import { Course } from '@application/entities/course/Course';
import { Lesson } from '@application/entities/outline/Lesson';
import { Module } from '@application/entities/outline/Module';
import { KSUID_PATTERN } from '@application/entities/shared/ksuid';

const ksuid = z.string().regex(KSUID_PATTERN);
const courseId = ksuid.transform((value) => Course.toId(value));
const moduleId = ksuid.transform((value) => Module.toId(value));
const lessonId = ksuid.transform((value) => Lesson.toId(value));

const MAX_BODY_BYTES = 32 * 1024;

const titleSchema = z.string().trim().min(3).max(120);
const bodySchema = z
  .string()
  .refine((body) => Buffer.byteLength(body, 'utf8') <= MAX_BODY_BYTES, {
    message: 'The body takes at most 32 KiB.',
  });
const durationSchema = z.number().int().min(1).max(600);

export const outlineParamsSchema = z.object({ id: courseId });

export const moduleParamsSchema = z.object({ id: courseId, mid: moduleId });

export const lessonParamsSchema = z.object({
  id: courseId,
  mid: moduleId,
  lid: lessonId,
});

export const moduleBodySchema = z.object({ title: titleSchema });

export const createLessonSchema = z.object({
  title: titleSchema,
  body: bodySchema.default(''),
  durationMinutes: durationSchema,
});

export const updateLessonSchema = z
  .object({
    title: titleSchema.optional(),
    body: bodySchema.optional(),
    durationMinutes: durationSchema.optional(),
  })
  .refine(
    (changes) =>
      changes.title !== undefined ||
      changes.body !== undefined ||
      changes.durationMinutes !== undefined,
    { message: 'Send at least one field.' },
  );

export const outlineBodySchema = z.object({
  modules: z.array(z.object({ id: moduleId, lessonIds: z.array(lessonId) })),
});
