import { UpdateMeUseCase } from '@application/usecases/account/UpdateMeUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';

export function makeUpdateMeUseCase(): UpdateMeUseCase {
  const accountsRepository = makeAccountRepository();
  const coursesRepository = makeCourseRepository();

  return new UpdateMeUseCase(accountsRepository, coursesRepository);
}
