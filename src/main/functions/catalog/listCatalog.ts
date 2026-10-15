import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeListCatalogController } from '@main/factories/catalog/makeListCatalogController';

const controller = makeListCatalogController();

export const handler = lambdaHttpAdapter(controller);
