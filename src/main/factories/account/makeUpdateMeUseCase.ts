import { UpdateMeUseCase } from '@application/usecases/account/UpdateMeUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';

export function makeUpdateMeUseCase(): UpdateMeUseCase {
  return new UpdateMeUseCase(makeAccountRepository());
}
