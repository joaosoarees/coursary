import type { AccountRepository } from '@application/repositories/AccountRepository';
import {
  type AccountProfile,
  toAccountProfile,
} from '@application/usecases/account/AccountProfile';
import { requireActive } from '@application/usecases/account/requireActive';

export class GetMeUseCase {
  constructor(private readonly accountsRepository: AccountRepository) {}

  async execute({ accountId }: GetMeUseCase.Input): Promise<AccountProfile> {
    const account = await this.accountsRepository.findById(accountId, {
      consistent: false,
    });

    return toAccountProfile(requireActive(account));
  }
}

export namespace GetMeUseCase {
  export interface Input {
    accountId: string;
  }
}
