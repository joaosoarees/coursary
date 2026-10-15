import { Account } from '@application/entities/Account';
import { InvalidSession } from '@application/errors/InvalidSession';
import type { AccountRepository } from '@application/repositories/AccountRepository';

export class ResolveCallerUseCase {
  constructor(private readonly accountsRepository: AccountRepository) {}

  async execute({
    accountId,
  }: ResolveCallerUseCase.Input): Promise<ResolveCallerUseCase.Output> {
    const account = await this.accountsRepository.findById(accountId, {
      consistent: true,
    });

    if (!account) {
      throw new InvalidSession();
    }

    const activeAccount = Account.requireActive(account);

    return { accountId: activeAccount.id, role: activeAccount.role };
  }
}

export namespace ResolveCallerUseCase {
  export interface Input {
    accountId: string;
  }

  export interface Output {
    accountId: string;
    role: Account.Role;
  }
}
