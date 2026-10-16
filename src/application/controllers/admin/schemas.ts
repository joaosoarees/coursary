import { z } from 'zod';

import { Account } from '@application/entities/account/Account';
import { KSUID_PATTERN } from '@application/entities/shared/ksuid';

export const accountIdParamsSchema = z.object({
  id: z
    .string()
    .regex(KSUID_PATTERN)
    .transform((value) => Account.toId(value)),
});
