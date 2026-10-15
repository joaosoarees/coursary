import { z } from 'zod';

import { Account } from '@application/entities/Account';
import { KSUID_PATTERN } from '@application/entities/ksuid';

export const accountIdParamsSchema = z.object({
  id: z
    .string()
    .regex(KSUID_PATTERN)
    .transform((value) => Account.toId(value)),
});
