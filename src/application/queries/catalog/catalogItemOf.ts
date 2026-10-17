import type { Course } from '@application/entities/course/Course';
import type { CatalogQuery } from '@application/queries/catalog/CatalogQuery';

// One shape for a course in the catalog and in search results (Q326).
export function catalogItemOf(course: Course): CatalogQuery.Item {
  return {
    id: course.id,
    title: course.title,
    instructorName: course.instructorName,
    lessonCount: course.lessonCount,
    enrollmentCount: course.enrollmentCount,
    ratingCount: course.ratingCount,
    ratingAverage: course.ratingAverage(),
    publishedAt: course.publishedAt?.toISOString() ?? '',
  };
}
