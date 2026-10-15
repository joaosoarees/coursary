import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeChangeRoleController } from '@main/factories/admin/makeChangeRoleController';

const controller = makeChangeRoleController();

export const handler = lambdaHttpAdapter(controller);
