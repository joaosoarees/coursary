import { GetMeController } from '@application/controllers/account/GetMeController';
import { makeGetMeUseCase } from '@main/factories/account/makeGetMeUseCase';

export function makeGetMeController(): GetMeController {
  const getMeUseCase = makeGetMeUseCase();

  return new GetMeController(getMeUseCase);
}
