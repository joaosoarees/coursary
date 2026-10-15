import { z } from 'zod';

import { emailSchema } from '@application/controllers/auth/emailSchema';
import { lambdaInvokeAdapter } from '@main/adapters/lambdaInvokeAdapter';
import { makePromoteFirstAdminUseCase } from '@main/factories/admin/makePromoteFirstAdminUseCase';

export const handler = lambdaInvokeAdapter(
  z.object({ email: emailSchema }),
  makePromoteFirstAdminUseCase(),
);
