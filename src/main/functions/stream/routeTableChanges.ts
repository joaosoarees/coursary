import { dynamoStreamRouter } from '@main/adapters/dynamoStreamRouter';
import { makeCatalogIndexQueue } from '@main/factories/makeCatalogIndexQueue';

const catalogIndexQueue = makeCatalogIndexQueue();

export const handler = dynamoStreamRouter(catalogIndexQueue);
