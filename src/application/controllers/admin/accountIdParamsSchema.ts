import { z } from 'zod';

export const accountIdParamsSchema = z.object({ id: z.string().min(1) });
