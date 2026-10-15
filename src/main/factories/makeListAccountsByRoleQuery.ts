import type { ListAccountsByRoleQuery } from '@application/queries/ListAccountsByRoleQuery';
import { DynamoListAccountsByRoleQuery } from '@infra/database/dynamo/queries/DynamoListAccountsByRoleQuery';
import { makeAppConfig } from '@main/factories/makeAppConfig';

export function makeListAccountsByRoleQuery(): ListAccountsByRoleQuery {
  const appConfig = makeAppConfig();

  return new DynamoListAccountsByRoleQuery(appConfig);
}
