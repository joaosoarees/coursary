import { ResetPasswordController } from '@application/controllers/auth/ResetPasswordController';
import { ResetPasswordUseCase } from '@application/usecases/auth/ResetPasswordUseCase';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';
import { makeAccountRepository } from '@main/factories/makeAccountRepository';
import { makeAuthGateway } from '@main/factories/makeAuthGateway';

const authGateway = makeAuthGateway();
const accountsRepository = makeAccountRepository();
const resetPasswordUseCase = new ResetPasswordUseCase(
  authGateway,
  accountsRepository,
);
const controller = new ResetPasswordController(resetPasswordUseCase);

export const handler = lambdaHttpAdapter(controller);
