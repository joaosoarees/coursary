import { Controller } from '@application/contracts/Controller';
import type { AccountProfile } from '@application/usecases/account/AccountProfile';
import type { GetMeUseCase } from '@application/usecases/account/GetMeUseCase';

export class GetMeController extends Controller<'private', AccountProfile> {
  constructor(private readonly getMe: GetMeUseCase) {
    super();
  }

  protected async handle({
    accountId,
  }: Controller.Request<'private'>): Promise<
    Controller.Response<AccountProfile>
  > {
    return { statusCode: 200, body: await this.getMe.execute({ accountId }) };
  }
}
