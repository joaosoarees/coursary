import { Account } from '@application/entities/Account';
import { AuthUserExists } from '@application/errors/AuthUserExists';
import { EmailInUse } from '@application/errors/EmailInUse';
import { AuthGateway } from '@application/gateways/AuthGateway';
import { AccountRepository } from '@application/repositories/AccountRepository';
import { Injectable } from '@kernel/decorators/Injectable';
import { Saga } from '@shared/saga/Saga';

@Injectable()
export class SignUpUseCase {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly auth: AuthGateway,
  ) {}

  async execute({
    name,
    email,
    password,
  }: SignUpUseCase.Input): Promise<SignUpUseCase.Output> {
    const account = Account.create({ name, email });
    const saga = new Saga();

    return saga.run(async () => {
      await this.accounts.create(account);
      saga.addCompensation(() => this.accounts.delete(account));

      const { externalId } = await this.signUpInAuth(account, password);
      saga.addCompensation(async () => {
        await this.auth.deleteUnconfirmedUser(account.email);
      });

      account.externalId = externalId;
      await this.accounts.saveExternalId(account);

      return { accountId: account.id };
    });
  }

  private async signUpInAuth(
    account: Account,
    password: string,
  ): Promise<AuthGateway.SignUpResult> {
    const params = {
      email: account.email,
      password,
      internalId: account.id,
    };

    try {
      return await this.auth.signUp(params);
    } catch (error) {
      if (!(error instanceof AuthUserExists)) {
        throw error;
      }

      const orphan = await this.auth.deleteUnconfirmedUser(account.email);

      if (orphan === 'confirmed') {
        console.error(
          JSON.stringify({
            event: 'ConfirmedUserWithoutClaim',
            accountId: account.id,
          }),
        );
        throw new EmailInUse();
      }

      return this.auth.signUp(params);
    }
  }
}

export namespace SignUpUseCase {
  export interface Input {
    name: string;
    email: string;
    password: string;
  }

  export interface Output {
    accountId: string;
  }
}
