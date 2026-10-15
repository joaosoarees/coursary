import { ResolveCallerUseCase } from '@application/usecases/account/ResolveCallerUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';

export function makeResolveCallerUseCase(): ResolveCallerUseCase {
  const accountsRepository = makeAccountRepository();

  return new ResolveCallerUseCase(accountsRepository);
}
