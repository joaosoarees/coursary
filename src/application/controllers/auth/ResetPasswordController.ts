import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { emailSchema } from '@application/controllers/auth/emailSchema';
import { passwordSchema } from '@application/controllers/auth/passwordSchema';
import type { ResetPasswordUseCase } from '@application/usecases/auth/ResetPasswordUseCase';

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\S{1,2048}$/),
  newPassword: passwordSchema,
});

export class ResetPasswordController extends Controller<'public'> {
  protected override readonly bodySchema = resetPasswordSchema;

  constructor(private readonly resetPassword: ResetPasswordUseCase) {
    super();
  }

  protected async handle(
    request: Controller.Request<'public', ResetPasswordController.Body>,
  ): Promise<Controller.Response<undefined>> {
    await this.resetPassword.execute(request.body);

    return { statusCode: 204 };
  }
}

export namespace ResetPasswordController {
  export type Body = z.infer<typeof resetPasswordSchema>;
}
