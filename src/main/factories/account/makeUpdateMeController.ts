import { UpdateMeController } from '@application/controllers/account/UpdateMeController';
import { makeUpdateMeUseCase } from '@main/factories/account/makeUpdateMeUseCase';

export function makeUpdateMeController(): UpdateMeController {
  return new UpdateMeController(makeUpdateMeUseCase());
}
