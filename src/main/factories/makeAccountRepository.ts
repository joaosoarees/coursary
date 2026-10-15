import type { AccountRepository } from '@application/repositories/AccountRepository';
import { DynamoAccountRepository } from '@infra/database/dynamo/repositories/DynamoAccountRepository';
import { makeAppConfig } from '@main/factories/makeAppConfig';

export function makeAccountRepository(): AccountRepository {
  return new DynamoAccountRepository(makeAppConfig());
}
