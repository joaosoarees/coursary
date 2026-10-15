import { cognitoPreTokenAdapter } from '@main/adapters/cognitoPreTokenAdapter';
import { makeIssueTokenClaimsUseCase } from '@main/factories/auth/makeIssueTokenClaimsUseCase';

export const handler = cognitoPreTokenAdapter(makeIssueTokenClaimsUseCase());
