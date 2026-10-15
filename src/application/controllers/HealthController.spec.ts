import { describe, expect, it } from 'vitest';

import { HealthController } from '@application/controllers/HealthController';

describe('HealthController', () => {
  it('should answer 200 with status ok', async () => {
    const response = await new HealthController().execute({ body: {} });

    expect(response).toEqual({ statusCode: 200, body: { status: 'ok' } });
  });
});
