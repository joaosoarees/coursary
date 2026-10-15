import type { AuthGateway } from '@application/gateways/AuthGateway';
import { CognitoAuthGateway } from '@infra/gateways/CognitoAuthGateway';
import { makeAppConfig } from '@main/factories/makeAppConfig';

export function makeAuthGateway(): AuthGateway {
  const appConfig = makeAppConfig();

  return new CognitoAuthGateway(appConfig);
}
