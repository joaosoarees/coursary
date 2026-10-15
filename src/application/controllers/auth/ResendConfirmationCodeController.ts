import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import { emailSchema } from '@application/controllers/auth/emailSchema';
import { ResendConfirmationCodeUseCase } from '@application/usecases/auth/ResendConfirmationCodeUseCase';
import { Schema } from '@kernel/decorators/Schema';

export const resendConfirmationCodeSchema = z.object({ email: emailSchema });

@Schema({ body: resendConfirmationCodeSchema })
export class ResendConfirmationCodeController extends Controller<'public'> {
  constructor(private readonly resendCode: ResendConfirmationCodeUseCase) {
    super();
  }

  protected async handle(
    request: Controller.Request<
      'public',
      ResendConfirmationCodeController.Body
    >,
  ): Promise<Controller.Response<undefined>> {
    await this.resendCode.execute(request.body);

    return { statusCode: 204 };
  }
}

export namespace ResendConfirmationCodeController {
  export type Body = z.infer<typeof resendConfirmationCodeSchema>;
}
