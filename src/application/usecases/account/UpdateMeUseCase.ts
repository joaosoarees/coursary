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
    account,
    name,
  }: UpdateMeUseCase.Input): Promise<AccountProfile> {
    const { id } = Account.requireActive(account);

    const updated = await this.accountsRepository.updateName(id, name);
    await this.coursesRepository.updateInstructorName(id, updated.name);

    return AccountProfile.fromAccount(updated);
  }
}

export namespace UpdateMeUseCase {
  export interface Input {
    account: Account;
    name: string;
  }
}
