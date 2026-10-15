import { Account } from '@application/entities/Account';
import type { AccountRepository } from '@application/repositories/AccountRepository';
import { AccountProfile } from '@application/usecases/account/AccountProfile';

export class GetMeUseCase {
  constructor(private readonly accountsRepository: AccountRepository) {}

  async execute({ accountId }: GetMeUseCase.Input): Promise<AccountProfile> {
    const account = await this.accountsRepository.findById(accountId, {
      consistent: false,
    });
    const activeAccount = Account.requireActive(account);

    return AccountProfile.fromAccount(activeAccount);
  }
}

export namespace GetMeUseCase {
  export interface Input {
    accountId: string;
  }
}
