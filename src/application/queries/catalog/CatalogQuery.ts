import type { Page } from '@application/contracts/Page';

export interface CatalogQuery {
  execute: (page: Page.Options) => Promise<Page<CatalogQuery.Item>>;
}

export namespace CatalogQuery {
  export interface Item {
    id: string;
    title: string;
    instructorName: string;
    lessonCount: number;
    enrollmentCount: number;
    ratingCount: number;
    // Computed on read; null before the first review (Q83, Q283).
    ratingAverage: number | null;
    publishedAt: string;
  }
}
