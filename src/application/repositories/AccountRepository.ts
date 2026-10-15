import type { Account } from '@application/entities/Account';
import type { RoleChange } from '@application/entities/RoleChange';

export interface AccountRepository {
  create(account: Account): Promise<void>;

  delete(account: Account): Promise<void>;

  saveExternalId(account: Account): Promise<void>;

  findById(
    id: string,
    options?: AccountRepository.ReadOptions,
  ): Promise<Account | null>;

  findByEmail(email: string): Promise<Account | null>;

  activate(account: Account): Promise<void>;

  updateName(id: string, name: string): Promise<Account>;

  changeRole(
    roleChange: RoleChange,
    options?: AccountRepository.ChangeRoleOptions,
  ): Promise<void>;
}

export namespace AccountRepository {
  export interface ReadOptions {
    consistent?: boolean;
  }

  export interface ChangeRoleOptions {
    adminCallerId?: string;
  }
}
