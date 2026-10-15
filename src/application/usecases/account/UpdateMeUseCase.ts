import type { AccountRepository } from '@application/repositories/AccountRepository';
import {
  type AccountProfile,
  toAccountProfile,
} from '@application/usecases/account/AccountProfile';
import { requireActive } from '@application/usecases/account/requireActive';

export class UpdateMeUseCase {
  constructor(private readonly accountsRepository: AccountRepository) {}

  async execute({
    accountId,
    name,
  }: UpdateMeUseCase.Input): Promise<AccountProfile> {
    requireActive(
      await this.accountsRepository.findById(accountId, { consistent: false }),
    );

    return toAccountProfile(
      await this.accountsRepository.updateName(accountId, name),
    );
  }
}

export namespace UpdateMeUseCase {
  export interface Input {
    accountId: string;
    name: string;
  }
}
