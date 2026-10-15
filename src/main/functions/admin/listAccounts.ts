import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeListAccountsController } from '@main/factories/admin/makeListAccountsController';

const controller = makeListAccountsController();

export const handler = lambdaHttpAdapter(controller);
