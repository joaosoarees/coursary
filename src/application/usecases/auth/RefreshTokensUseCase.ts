import { AuthGateway } from '@application/gateways/AuthGateway';
import { Injectable } from '@kernel/decorators/Injectable';

@Injectable()
export class RefreshTokensUseCase {
  constructor(private readonly authGateway: AuthGateway) {}

  execute({
    refreshToken,
  }: RefreshTokensUseCase.Input): Promise<AuthGateway.Tokens> {
    return this.authGateway.refreshTokens(refreshToken);
  }
}

export namespace RefreshTokensUseCase {
  export interface Input {
    refreshToken: string;
  }
}
