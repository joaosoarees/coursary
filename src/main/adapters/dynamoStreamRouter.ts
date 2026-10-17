import type { DynamoDBStreamEvent } from 'aws-lambda';

import type { CatalogIndexQueue } from '@application/gateways/catalog/CatalogIndexQueue';
import { courseToIndex } from '@infra/database/dynamo/stream/catalogChanges';

// The one reader of the table stream; each consumer gets its own queue (Q302).
export function dynamoStreamRouter(catalogIndexQueue: CatalogIndexQueue) {
  return async (event: DynamoDBStreamEvent): Promise<void> => {
    const requests = event.Records.flatMap((record) => {
      const courseId = courseToIndex(record);

      return courseId && record.eventID
        ? [{ courseId, deduplicationId: record.eventID }]
        : [];
    });

    await catalogIndexQueue.enqueue(requests);
  };
}
