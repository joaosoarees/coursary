import { ListAccountsController } from '@application/controllers/admin/ListAccountsController';
import { ListAccountsUseCase } from '@application/usecases/account/ListAccountsUseCase';
import { makeListAccountsByRoleQuery } from '@main/factories/makeListAccountsByRoleQuery';

export function makeListAccountsController(): ListAccountsController {
  const listAccountsByRoleQuery = makeListAccountsByRoleQuery();
  const listAccountsUseCase = new ListAccountsUseCase(listAccountsByRoleQuery);

  return new ListAccountsController(listAccountsUseCase);
}
