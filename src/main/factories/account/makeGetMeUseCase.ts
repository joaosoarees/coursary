import { GetMeUseCase } from '@application/usecases/account/GetMeUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';

export function makeGetMeUseCase(): GetMeUseCase {
  const accountsRepository = makeAccountRepository();

  return new GetMeUseCase(accountsRepository);
}
