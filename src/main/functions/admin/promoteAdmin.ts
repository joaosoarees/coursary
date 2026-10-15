import { z } from 'zod';

import { emailSchema } from '@application/controllers/auth/emailSchema';
import { PromoteFirstAdminUseCase } from '@application/usecases/account/PromoteFirstAdminUseCase';
import { lambdaInvokeAdapter } from '@main/adapters/lambdaInvokeAdapter';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';

const schema = z.object({ email: emailSchema });
const accountsRepository = makeAccountRepository();
const useCase = new PromoteFirstAdminUseCase(accountsRepository);

export const handler = lambdaInvokeAdapter(schema, useCase);
