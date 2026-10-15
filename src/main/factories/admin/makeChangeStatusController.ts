import { ChangeStatusController } from '@application/controllers/admin/ChangeStatusController';
import { ChangeStatusUseCase } from '@application/usecases/account/ChangeStatusUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

export function makeChangeStatusController(
  status: ChangeStatusUseCase.Status,
): ChangeStatusController {
  const accountsRepository = makeAccountRepository();
  const authGateway = makeAuthGateway();
  const changeStatusUseCase = new ChangeStatusUseCase(
    accountsRepository,
    authGateway,
  );

  return new ChangeStatusController(changeStatusUseCase, status);
}
