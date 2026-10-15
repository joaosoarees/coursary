import { FindAccountByEmailController } from '@application/controllers/admin/FindAccountByEmailController';
import { FindAccountByEmailUseCase } from '@application/usecases/account/FindAccountByEmailUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';

export function makeFindAccountByEmailController(): FindAccountByEmailController {
  const accountsRepository = makeAccountRepository();
  const findAccountByEmailUseCase = new FindAccountByEmailUseCase(
    accountsRepository,
  );

  return new FindAccountByEmailController(findAccountByEmailUseCase);
}
