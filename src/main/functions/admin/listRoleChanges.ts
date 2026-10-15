import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeListRoleChangesController } from '@main/factories/admin/makeListRoleChangesController';

const controller = makeListRoleChangesController();

export const handler = lambdaHttpAdapter(controller);
