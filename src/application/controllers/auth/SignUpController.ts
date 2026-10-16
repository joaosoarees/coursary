import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import {
  emailSchema,
  passwordSchema,
} from '@application/controllers/auth/schemas';
import { SignUpUseCase } from '@application/usecases/auth/SignUpUseCase';

export const signUpSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: passwordSchema,
});

export class SignUpController extends Controller<
  'public',
  SignUpController.Response
> {
  protected override readonly bodySchema = signUpSchema;

  constructor(private readonly signUp: SignUpUseCase) {
    super();
  }

  protected async handle(
    request: Controller.Request<'public', SignUpController.Body>,
  ): Promise<Controller.Response<SignUpController.Response>> {
    const { accountId } = await this.signUp.execute(request.body);

    return { statusCode: 201, body: { accountId } };
  }
}

export namespace SignUpController {
  export type Body = z.infer<typeof signUpSchema>;

  export interface Response {
    accountId: string;
  }
}
