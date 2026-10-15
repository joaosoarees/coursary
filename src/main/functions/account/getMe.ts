import { GetMeController } from '@application/controllers/account/GetMeController';
import { GetMeUseCase } from '@application/usecases/account/GetMeUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeResolveCallerUseCase } from '@main/factories/makeResolveCallerUseCase';

const accountsRepository = makeAccountRepository();
const getMeUseCase = new GetMeUseCase(accountsRepository);
const controller = new GetMeController(getMeUseCase);

const resolveCaller = makeResolveCallerUseCase();

export const handler = lambdaHttpAdapter(controller, resolveCaller);
