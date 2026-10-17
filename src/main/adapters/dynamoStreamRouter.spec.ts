import { marshall } from '@aws-sdk/util-dynamodb';
import type { DynamoDBRecord } from 'aws-lambda';
import { describe, expect, it } from 'vitest';

import type { CatalogIndexQueue } from '@application/gateways/catalog/CatalogIndexQueue';
import { dynamoStreamRouter } from '@main/adapters/dynamoStreamRouter';

const published = (id: string, title: string) => ({
  type: 'Course',
  id,
  title,
  instructorName: 'Ana',
  status: 'PUBLISHED',
  publishedAt: '2026-10-17T12:00:00.000Z',
});

const modify = (
  eventID: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): DynamoDBRecord => ({
  eventID,
  eventName: 'MODIFY',
  dynamodb: {
    OldImage: marshall(before) as never,
    NewImage: marshall(after) as never,
  },
});

describe('dynamoStreamRouter', () => {
  it('should enqueue the courses whose search record changed, in order, one per change', async () => {
    const sent: CatalogIndexQueue.Request[] = [];
    const route = dynamoStreamRouter({
      enqueue: (requests) => {
        sent.push(...requests);

        return Promise.resolve();
      },
    });

    await route({
      Records: [
        modify('e1', published('c1', 'A'), published('c1', 'B')),
        modify('e2', published('c2', 'A'), {
          ...published('c2', 'A'),
          enrollmentCount: 1,
        }),
        modify('e3', published('c1', 'B'), published('c1', 'C')),
      ],
    });

    expect(sent).toEqual([
      { courseId: 'c1', deduplicationId: 'e1' },
      { courseId: 'c1', deduplicationId: 'e3' },
    ]);
  });
});
