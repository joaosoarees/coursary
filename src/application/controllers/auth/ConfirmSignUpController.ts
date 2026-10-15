import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { emailSchema } from '@application/controllers/auth/emailSchema';
import { ConfirmSignUpUseCase } from '@application/usecases/auth/ConfirmSignUpUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { Schema } from '@kernel/decorators/Schema';

export const confirmSignUpSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\S{1,2048}$/),
});

@Injectable()
@Schema({ body: confirmSignUpSchema })
export class ConfirmSignUpController extends Controller<'public'> {
  constructor(private readonly confirmSignUp: ConfirmSignUpUseCase) {
    super();
  }

  protected async handle(
    request: Controller.Request<'public', ConfirmSignUpController.Body>,
  ): Promise<Controller.Response<undefined>> {
    await this.confirmSignUp.execute(request.body);

    return { statusCode: 204 };
  }
}

export namespace ConfirmSignUpController {
  export type Body = z.infer<typeof confirmSignUpSchema>;
}
