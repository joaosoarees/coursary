import { cognitoPreTokenAdapter } from '@main/adapters/cognitoPreTokenAdapter';
import { makeIssueTokenClaimsUseCase } from '@main/factories/auth/makeIssueTokenClaimsUseCase';

const useCase = makeIssueTokenClaimsUseCase();

export const handler = cognitoPreTokenAdapter(useCase);
