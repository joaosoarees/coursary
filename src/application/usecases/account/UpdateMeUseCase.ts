import { Account } from '@application/entities/Account';
import type { AccountRepository } from '@application/repositories/AccountRepository';
import { AccountProfile } from '@application/usecases/account/AccountProfile';

export class UpdateMeUseCase {
  constructor(private readonly accountsRepository: AccountRepository) {}

  async execute({
    accountId,
    name,
  }: UpdateMeUseCase.Input): Promise<AccountProfile> {
    const account = await this.accountsRepository.findById(accountId, {
      consistent: false,
    });
    Account.requireActive(account);

    const updated = await this.accountsRepository.updateName(accountId, name);

    return AccountProfile.fromAccount(updated);
  }
}

export namespace UpdateMeUseCase {
  export interface Input {
    accountId: string;
    name: string;
  }
}
