import type { Page } from '@application/contracts/Page';
import type { Account } from '@application/entities/Account';
import type { AccountSummary } from '@application/queries/AccountSummary';

export interface ListAccountsByRoleQuery {
  execute(input: ListAccountsByRoleQuery.Input): Promise<Page<AccountSummary>>;
}

export namespace ListAccountsByRoleQuery {
  export interface Input {
    role: Account.Role;
    status: Account.Status | undefined;
    page: Page.Options;
  }
}
