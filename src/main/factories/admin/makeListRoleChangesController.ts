import { ListRoleChangesController } from '@application/controllers/admin/ListRoleChangesController';
import { ListRoleChangesUseCase } from '@application/usecases/account/ListRoleChangesUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeListRoleChangesQuery } from '@main/factories/makeListRoleChangesQuery';

export function makeListRoleChangesController(): ListRoleChangesController {
  const accountsRepository = makeAccountRepository();
  const listRoleChangesQuery = makeListRoleChangesQuery();
  const listRoleChangesUseCase = new ListRoleChangesUseCase(
    accountsRepository,
    listRoleChangesQuery,
  );

  return new ListRoleChangesController(listRoleChangesUseCase);
}
