import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeFindAccountByEmailController } from '@main/factories/admin/makeFindAccountByEmailController';

const controller = makeFindAccountByEmailController();

export const handler = lambdaHttpAdapter(controller);
