import { z } from 'zod';

export const emailSchema = z.string().trim().pipe(z.email().max(254));

export const passwordSchema = z
  .string()
  .min(8)
  .max(256)
  .regex(/[a-z]/, 'Must contain a lowercase letter.')
  .regex(/[0-9]/, 'Must contain a number.');
