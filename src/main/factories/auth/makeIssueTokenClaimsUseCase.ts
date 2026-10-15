import { IssueTokenClaimsUseCase } from '@application/usecases/auth/IssueTokenClaimsUseCase';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';

export function makeIssueTokenClaimsUseCase(): IssueTokenClaimsUseCase {
  return new IssueTokenClaimsUseCase(makeAccountRepository());
}
