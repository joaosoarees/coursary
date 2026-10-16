import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import type { Course } from '@application/entities/course/Course';
import type { Lesson } from '@application/entities/outline/Lesson';
import type { Module } from '@application/entities/outline/Module';

export interface LessonRepository {
  findById(
    courseId: Course.Id,
    moduleId: Module.Id,
    id: Lesson.Id,
  ): Promise<Lesson | null>;

  // The body alone, without knowing the module; null when not in the course.
  findContent(
    courseId: Course.Id,
    id: Lesson.Id,
  ): Promise<LessonRepository.Content | null>;

  createOperations(lesson: Lesson): UnitOfWork.Operation[];

  updateOperations(lesson: Lesson): UnitOfWork.Operation[];

  deleteOperations(lesson: Lesson): UnitOfWork.Operation[];

  repositionOperation(lesson: Lesson): UnitOfWork.Operation;

  moveOperations(
    lesson: Lesson,
    fromModuleId: Module.Id,
  ): UnitOfWork.Operation[];
}

export namespace LessonRepository {
  export interface Content {
    lessonId: Lesson.Id;
    courseId: Course.Id;
    body: string;
  }
}
