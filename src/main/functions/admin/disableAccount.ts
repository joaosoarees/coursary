import { accountStatuses } from '@application/entities/Account';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeResolveCallerUseCase } from '@main/factories/account/makeResolveCallerUseCase';
import { makeChangeStatusController } from '@main/factories/admin/makeChangeStatusController';

const controller = makeChangeStatusController(accountStatuses.Disabled);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
