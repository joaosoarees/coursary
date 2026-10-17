import type { SQSRecord } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { sqsBatchAdapter } from '@main/adapters/sqsBatchAdapter';

const message = (messageId: string, body: unknown) =>
  ({ messageId, body: JSON.stringify(body) }) as SQSRecord;

const schema = z.object({ n: z.number() });

describe('sqsBatchAdapter', () => {
  it('should run every message in order and report no failure', async () => {
    const seen: number[] = [];
    const handler = sqsBatchAdapter(schema, {
      execute: ({ n }) => {
        seen.push(n);

        return Promise.resolve();
      },
    });

    const event = {
      Records: [message('m1', { n: 1 }), message('m2', { n: 2 })],
    };

    await expect(handler(event)).resolves.toEqual({ batchItemFailures: [] });
    expect(seen).toEqual([1, 2]);
  });

  it('should give back the failed message and every one after it, unread', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const execute = vi.fn(({ n }: { n: number }) =>
      n === 2 ? Promise.reject(new Error('down')) : Promise.resolve(),
    );
    const handler = sqsBatchAdapter(schema, { execute });

    const event = {
      Records: [
        message('m1', { n: 1 }),
        message('m2', { n: 2 }),
        message('m3', { n: 3 }),
      ],
    };

    await expect(handler(event)).resolves.toEqual({
      batchItemFailures: [{ itemIdentifier: 'm2' }, { itemIdentifier: 'm3' }],
    });
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('should treat a message that does not parse as failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const handler = sqsBatchAdapter(schema, {
      execute: () => Promise.resolve(),
    });

    await expect(
      handler({ Records: [message('m1', { n: 'x' })] }),
    ).resolves.toEqual({ batchItemFailures: [{ itemIdentifier: 'm1' }] });
  });
});
