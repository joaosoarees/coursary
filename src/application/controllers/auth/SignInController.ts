import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { emailSchema } from '@application/controllers/auth/emailSchema';
import type { AuthGateway } from '@application/gateways/AuthGateway';
import { SignInUseCase } from '@application/usecases/auth/SignInUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { Schema } from '@kernel/decorators/Schema';

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(256),
});

@Injectable()
@Schema({ body: signInSchema })
export class SignInController extends Controller<'public', AuthGateway.Tokens> {
  constructor(private readonly signIn: SignInUseCase) {
    super();
  }

  protected async handle(
    request: Controller.Request<'public', SignInController.Body>,
  ): Promise<Controller.Response<AuthGateway.Tokens>> {
    return { statusCode: 200, body: await this.signIn.execute(request.body) };
  }
}

export namespace SignInController {
  export type Body = z.infer<typeof signInSchema>;
}
