import { ChangeStatusController } from '@application/controllers/admin/ChangeStatusController';
import { ChangeStatusUseCase } from '@application/usecases/account/ChangeStatusUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';

export function makeChangeStatusController(
  status: ChangeStatusUseCase.Status,
): ChangeStatusController {
  const accountsRepository = makeAccountRepository();
  const changeStatusUseCase = new ChangeStatusUseCase(accountsRepository);

  return new ChangeStatusController(changeStatusUseCase, status);
}
