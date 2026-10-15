import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import type { Course } from '@application/entities/Course';
import type { Lesson } from '@application/entities/Lesson';
import type { Module } from '@application/entities/Module';

export interface LessonRepository {
  findById(
    courseId: Course.Id,
    moduleId: Module.Id,
    id: Lesson.Id,
  ): Promise<Lesson | null>;

  createOperations(lesson: Lesson): UnitOfWork.Operation[];

  updateOperations(lesson: Lesson): UnitOfWork.Operation[];

  deleteOperations(lesson: Lesson): UnitOfWork.Operation[];

  repositionOperation(lesson: Lesson): UnitOfWork.Operation;

  moveOperations(
    lesson: Lesson,
    fromModuleId: Module.Id,
  ): UnitOfWork.Operation[];
}
