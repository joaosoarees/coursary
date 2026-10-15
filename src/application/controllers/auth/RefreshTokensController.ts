import { z } from 'zod';

import { Controller } from '@application/contracts/Controller';
import type { AuthGateway } from '@application/gateways/AuthGateway';
import { RefreshTokensUseCase } from '@application/usecases/auth/RefreshTokensUseCase';

export const refreshTokensSchema = z.object({
  refreshToken: z
    .string()
    .max(8192)
    .regex(/^[A-Za-z0-9\-_=.]+$/),
});

export class RefreshTokensController extends Controller<
  'public',
  AuthGateway.Tokens
> {
  protected override readonly bodySchema = refreshTokensSchema;

  constructor(private readonly refreshTokens: RefreshTokensUseCase) {
    super();
  }

  protected async handle(
    request: Controller.Request<'public', RefreshTokensController.Body>,
  ): Promise<Controller.Response<AuthGateway.Tokens>> {
    const tokens = await this.refreshTokens.execute(request.body);

    return { statusCode: 200, body: tokens };
  }
}

export namespace RefreshTokensController {
  export type Body = z.infer<typeof refreshTokensSchema>;
}
