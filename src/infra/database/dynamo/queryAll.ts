import { QueryCommand, type QueryCommandInput } from '@aws-sdk/lib-dynamodb';

import { dynamoClient } from '@infra/clients/dynamoClient';

// Every item a Query matches, following LastEvaluatedKey; for collections
// that are read whole and stay small (Q267: the fifth copy became this).
export async function queryAll<TItem>(
  input: Omit<QueryCommandInput, 'ExclusiveStartKey'>,
): Promise<TItem[]> {
  const items: TItem[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const page = await dynamoClient.send(
      new QueryCommand({ ...input, ExclusiveStartKey }),
    );
    items.push(...((page.Items ?? []) as TItem[]));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}
