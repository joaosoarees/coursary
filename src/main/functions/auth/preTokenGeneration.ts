import '@main/bindings';

import { IssueTokenClaimsUseCase } from '@application/usecases/auth/IssueTokenClaimsUseCase';
import { Registry } from '@kernel/di/Registry';
import { cognitoPreTokenAdapter } from '@main/adapters/cognitoPreTokenAdapter';

export const handler = cognitoPreTokenAdapter(
  Registry.getInstance().resolve(IssueTokenClaimsUseCase),
);
