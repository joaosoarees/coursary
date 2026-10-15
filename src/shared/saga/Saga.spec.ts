import { describe, expect, it, vi } from 'vitest';

import { Saga } from '@shared/saga/Saga';

describe('Saga', () => {
  it('should return the result and run no compensation when the work succeeds', async () => {
    const saga = new Saga();
    const compensation = vi.fn(() => Promise.resolve());

    const result = await saga.run(() => {
      saga.addCompensation(compensation);
      return Promise.resolve('done');
    });

    expect(result).toBe('done');
    expect(compensation).not.toHaveBeenCalled();
  });

  it('should run the compensations in reverse order and rethrow the error', async () => {
    const saga = new Saga();
    const order: string[] = [];
    const failure = new Error('cognito is down');

    await expect(
      saga.run(() => {
        saga.addCompensation(() => {
          order.push('first');
          return Promise.resolve();
        });
        saga.addCompensation(() => {
          order.push('second');
          return Promise.resolve();
        });
        return Promise.reject(failure);
      }),
    ).rejects.toBe(failure);
    expect(order).toEqual(['second', 'first']);
  });

  it('should keep compensating when one compensation fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const saga = new Saga();
    const last = vi.fn(() => Promise.resolve());

    await expect(
      saga.run(() => {
        saga.addCompensation(last);
        saga.addCompensation(() => Promise.reject(new Error('delete failed')));
        return Promise.reject(new Error('cognito is down'));
      }),
    ).rejects.toThrow('cognito is down');
    expect(last).toHaveBeenCalledOnce();
  });

  it('should start empty for every new saga', async () => {
    const earlier = vi.fn(() => Promise.resolve());
    new Saga().addCompensation(earlier);

    await expect(
      new Saga().run(() => Promise.reject(new Error('fail'))),
    ).rejects.toThrow('fail');
    expect(earlier).not.toHaveBeenCalled();
  });
});
