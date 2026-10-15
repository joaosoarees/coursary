import { z } from 'zod';

import { emailSchema } from '@application/controllers/auth/emailSchema';
import { lambdaInvokeAdapter } from '@main/adapters/lambdaInvokeAdapter';
import { makePromoteFirstAdminUseCase } from '@main/factories/admin/makePromoteFirstAdminUseCase';

const schema = z.object({ email: emailSchema });
const useCase = makePromoteFirstAdminUseCase();

export const handler = lambdaInvokeAdapter(schema, useCase);
