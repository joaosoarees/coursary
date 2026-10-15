import { ChangeRoleController } from '@application/controllers/admin/ChangeRoleController';
import { ChangeRoleUseCase } from '@application/usecases/account/ChangeRoleUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';

export function makeChangeRoleController(): ChangeRoleController {
  const accountsRepository = makeAccountRepository();
  const changeRoleUseCase = new ChangeRoleUseCase(accountsRepository);

  return new ChangeRoleController(changeRoleUseCase);
}
