import type { Course } from '@application/entities/course/Course';
import type { CourseOutlineQuery } from '@application/queries/outline/CourseOutlineQuery';

export interface CoursePageQuery {
  // A published course with its outline, or null for anything else (Q235).
  execute(courseId: Course.Id): Promise<CoursePageQuery.Page | null>;
}

export namespace CoursePageQuery {
  export interface Page extends CourseOutlineQuery.Outline {
    id: string;
    title: string;
    description: string;
    instructorName: string;
    lessonCount: number;
    enrollmentCount: number;
    publishedAt: string;
  }
}
