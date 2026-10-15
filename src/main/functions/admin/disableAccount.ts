import { ChangeStatusController } from '@application/controllers/admin/ChangeStatusController';
import { accountStatuses } from '@application/entities/Account';
import { ChangeStatusUseCase } from '@application/usecases/account/ChangeStatusUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';

const accountsRepository = makeAccountRepository();
const changeStatusUseCase = new ChangeStatusUseCase(accountsRepository);
const controller = new ChangeStatusController(
  changeStatusUseCase,
  accountStatuses.Disabled,
);
const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
