import { Controller } from '@application/contracts/Controller';

export class HealthController extends Controller<{ status: 'ok' }> {
  handle() {
    return Promise.resolve({
      statusCode: 200,
      body: { status: 'ok' as const },
    });
  }
}
