import type { Course } from '@application/entities/course/Course';

export interface CourseOutlineQuery {
  execute(
    courseId: Course.Id,
    options?: CourseOutlineQuery.ReadOptions,
  ): Promise<CourseOutlineQuery.Outline>;
}

export namespace CourseOutlineQuery {
  // Editing decides on what it reads, so it reads strongly (Q288).
  export interface ReadOptions {
    consistent?: boolean;
  }

  export interface Outline {
    modules: Module[];
  }

  export interface Module {
    id: string;
    title: string;
    position: number;
    lessons: Lesson[];
  }

  export interface Lesson {
    id: string;
    title: string;
    durationMinutes: number;
    position: number;
  }
}
