import { describe, expect, it, vi } from 'vitest';

import { anAccountId } from '@tests/support/ids';

import { Course } from '@application/entities/course/Course';
import type { SecureParameter } from '@infra/clients/SecureParameter';
import { AlgoliaCatalogIndex } from '@infra/gateways/catalog/AlgoliaCatalogIndex';

interface SentRequest {
  method: string;
  url: string;
  data?: string | Uint8Array;
}

const parameter = (value: string) =>
  ({ get: () => Promise.resolve(value) }) as SecureParameter;

const indexWithRequests = () => {
  const sent: SentRequest[] = [];
  const index = new AlgoliaCatalogIndex(
    'test_courses',
    parameter('APPID'),
    parameter('write-key'),
    {
      requester: {
        send: (request: SentRequest) => {
          sent.push(request);

          return Promise.resolve({
            status: 200,
            content: JSON.stringify({ taskID: 1, objectID: 'x' }),
            isTimedOut: false,
          });
        },
      },
    },
  );

  return { index, sent };
};

describe('AlgoliaCatalogIndex', () => {
  it('should save the record under the course id with only the searched fields', async () => {
    const { index, sent } = indexWithRequests();
    const courseId = Course.toId(anAccountId());

    await index.save({
      courseId,
      title: 'DynamoDB',
      description: 'Keys',
      instructorName: 'Ana',
      publishedAt: '2026-10-17T12:00:00.000Z',
    });

    expect(sent).toHaveLength(1);
    // saveObject is a POST with the objectID in the body: it replaces that record.
    expect(sent[0]).toMatchObject({
      method: 'POST',
      url: expect.stringContaining('/1/indexes/test_courses?') as string,
    });
    expect(JSON.parse(String(sent[0]?.data))).toEqual({
      objectID: courseId,
      title: 'DynamoDB',
      description: 'Keys',
      instructorName: 'Ana',
      publishedAt: '2026-10-17T12:00:00.000Z',
    });
  });

  it('should delete the record of a course', async () => {
    const { index, sent } = indexWithRequests();
    const courseId = Course.toId(anAccountId());

    await index.remove(courseId);

    expect(sent[0]).toMatchObject({
      method: 'DELETE',
      url: expect.stringContaining(
        `/1/indexes/test_courses/${courseId}`,
      ) as string,
    });
  });

  it('should read the keys again after a failure', async () => {
    const get = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('denied'))
      .mockResolvedValue('APPID');
    const appId = { get } as unknown as SecureParameter;
    const index = new AlgoliaCatalogIndex(
      'test_courses',
      appId,
      parameter('write-key'),
      {
        requester: {
          send: () =>
            Promise.resolve({ status: 200, content: '{}', isTimedOut: false }),
        },
      },
    );
    const courseId = Course.toId(anAccountId());

    await expect(index.remove(courseId)).rejects.toThrow('denied');
    await expect(index.remove(courseId)).resolves.toBeUndefined();
  });
});
