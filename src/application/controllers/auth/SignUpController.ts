import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { SignUpUseCase } from '@application/usecases/auth/SignUpUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { Schema } from '@kernel/decorators/Schema';

export const signUpSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  password: z
    .string()
    .min(8)
    .max(256)
    .regex(/[a-z]/, 'Must contain a lowercase letter.')
    .regex(/[0-9]/, 'Must contain a number.'),
});

@Injectable()
@Schema({ body: signUpSchema })
export class SignUpController extends Controller<
  'public',
  SignUpController.Response
> {
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
