import { describe, expect, it } from 'vitest';

import { searchSchema } from '@application/controllers/catalog/SearchCatalogController';

describe('searchSchema', () => {
  it('should trim the text and default to the first page of 20', () => {
    expect(searchSchema.parse({ q: '  dynamo ' })).toEqual({
      q: 'dynamo',
      page: 0,
      perPage: 20,
    });
  });

  it.each([
    [{}],
    [{ q: '   ' }],
    [{ q: 'x'.repeat(201) }],
    [{ q: 'x', page: '-1' }],
    [{ q: 'x', page: '50' }],
    [{ q: 'x', perPage: '0' }],
    [{ q: 'x', perPage: '51' }],
  ])('should refuse %o', (query) => {
    expect(searchSchema.safeParse(query).success).toBe(false);
  });
});
