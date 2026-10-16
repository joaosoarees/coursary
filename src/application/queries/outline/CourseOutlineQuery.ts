import type { Course } from '@application/entities/course/Course';

export interface CourseOutlineQuery {
  execute(courseId: Course.Id): Promise<CourseOutlineQuery.Outline>;
}

export namespace CourseOutlineQuery {
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
