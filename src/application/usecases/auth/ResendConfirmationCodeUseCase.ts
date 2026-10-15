import { AuthGateway } from '@application/gateways/AuthGateway';
import { AccountRepository } from '@application/repositories/AccountRepository';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class ResendConfirmationCodeUseCase {
  constructor(
    private readonly accountsRepository: AccountRepository,
    private readonly authGateway: AuthGateway,
  ) {}

  async execute({ email }: ResendConfirmationCodeUseCase.Input): Promise<void> {
    const account = await this.accountsRepository.findPendingByEmail(email);

    if (!account) {
      return;
    }

    await this.authGateway.resendConfirmationCode(account.email);
  }
}

export namespace ResendConfirmationCodeUseCase {
  export interface Input {
    email: string;
  }
}
