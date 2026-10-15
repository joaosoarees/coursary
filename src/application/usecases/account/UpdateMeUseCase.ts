import { Account } from '@application/entities/Account';
import type { AccountRepository } from '@application/repositories/AccountRepository';
import type { CourseRepository } from '@application/repositories/CourseRepository';
import { AccountProfile } from '@application/usecases/account/AccountProfile';

export class UpdateMeUseCase {
  constructor(
    private readonly accountsRepository: AccountRepository,
    private readonly coursesRepository: CourseRepository,
  ) {}

  async execute({
    accountId,
    name,
  }: UpdateMeUseCase.Input): Promise<AccountProfile> {
    const account = await this.accountsRepository.findById(accountId, {
      consistent: false,
    });
    Account.requireActive(account);

    const updated = await this.accountsRepository.updateName(accountId, name);
    await this.coursesRepository.updateInstructorName(accountId, updated.name);

    return AccountProfile.fromAccount(updated);
  }
}

export namespace UpdateMeUseCase {
  export interface Input {
    accountId: Account.Id;
    name: string;
  }
}
