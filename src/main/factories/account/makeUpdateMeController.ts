import { UpdateMeController } from '@application/controllers/account/UpdateMeController';
import { makeUpdateMeUseCase } from '@main/factories/account/makeUpdateMeUseCase';

export function makeUpdateMeController(): UpdateMeController {
  const updateMeUseCase = makeUpdateMeUseCase();

  return new UpdateMeController(updateMeUseCase);
}
