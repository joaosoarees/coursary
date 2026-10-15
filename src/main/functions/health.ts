import { HealthController } from '@application/controllers/HealthController';
import { lambdaHttpAdapter } from '@main/adapters/lambdaHttpAdapter';

export const handler = lambdaHttpAdapter(new HealthController());
