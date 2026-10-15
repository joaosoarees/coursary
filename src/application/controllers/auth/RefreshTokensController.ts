import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import type { AuthGateway } from '@application/gateways/AuthGateway';
import { RefreshTokensUseCase } from '@application/usecases/auth/RefreshTokensUseCase';
import { Injectable } from '@kernel/decorators/Injectable';
import { Schema } from '@kernel/decorators/Schema';

export const refreshTokensSchema = z.object({
  refreshToken: z
    .string()
    .max(8192)
    .regex(/^[A-Za-z0-9\-_=.]+$/),
});

@Injectable()
@Schema({ body: refreshTokensSchema })
export class RefreshTokensController extends Controller<
  'public',
  AuthGateway.Tokens
> {
  constructor(private readonly refreshTokens: RefreshTokensUseCase) {
    super();
  }

  protected async handle(
    request: Controller.Request<'public', RefreshTokensController.Body>,
  ): Promise<Controller.Response<AuthGateway.Tokens>> {
    return {
      statusCode: 200,
      body: await this.refreshTokens.execute(request.body),
    };
  }
}

export namespace RefreshTokensController {
  export type Body = z.infer<typeof refreshTokensSchema>;
}
