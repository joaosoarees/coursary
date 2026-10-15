import { PromoteFirstAdminUseCase } from '@application/usecases/account/PromoteFirstAdminUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';

export function makePromoteFirstAdminUseCase(): PromoteFirstAdminUseCase {
  const accountsRepository = makeAccountRepository();

  return new PromoteFirstAdminUseCase(accountsRepository);
}
