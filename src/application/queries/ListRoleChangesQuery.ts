import type { Page } from '@application/contracts/Page';
import type { RoleChangeSummary } from '@application/queries/RoleChangeSummary';

export interface ListRoleChangesQuery {
  execute(input: ListRoleChangesQuery.Input): Promise<Page<RoleChangeSummary>>;
}

export namespace ListRoleChangesQuery {
  export interface Input {
    accountId: string;
    page: Page.Options;
  }
}
