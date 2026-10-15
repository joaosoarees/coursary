import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8)
  .max(256)
  .regex(/[a-z]/, 'Must contain a lowercase letter.')
  .regex(/[0-9]/, 'Must contain a number.');
