import { accountRoles } from '@application/entities/Account';
import { BOOTSTRAP_ACTOR, RoleChange } from '@application/entities/RoleChange';
import type { AccountRepository } from '@application/repositories/AccountRepository';
import { requireActive } from '@application/usecases/account/requireActive';

export class PromoteFirstAdminUseCase {
  constructor(private readonly accountsRepository: AccountRepository) {}

  async execute({
    email,
  }: PromoteFirstAdminUseCase.Input): Promise<PromoteFirstAdminUseCase.Output> {
    const account = requireActive(
      await this.accountsRepository.findByEmail(email),
    );

    if (account.role === accountRoles.Admin) {
      return { accountId: account.id, changed: false };
    }

    await this.accountsRepository.changeRole(
      RoleChange.create({
        account,
        toRole: accountRoles.Admin,
        changedBy: BOOTSTRAP_ACTOR,
      }),
    );

    return { accountId: account.id, changed: true };
  }
}

export namespace PromoteFirstAdminUseCase {
  export interface Input {
    email: string;
  }

  export interface Output {
    accountId: string;
    changed: boolean;
  }
}
