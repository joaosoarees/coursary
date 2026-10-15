import { PromoteFirstAdminUseCase } from '@application/usecases/account/PromoteFirstAdminUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';

export function makePromoteFirstAdminUseCase(): PromoteFirstAdminUseCase {
  return new PromoteFirstAdminUseCase(makeAccountRepository());
}
