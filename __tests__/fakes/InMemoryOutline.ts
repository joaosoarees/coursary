import { InMemoryUnitOfWork } from '@tests/fakes/InMemoryUnitOfWork';

import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import type { Course } from '@application/entities/course/Course';
import { Lesson } from '@application/entities/outline/Lesson';
import { Module } from '@application/entities/outline/Module';
import { Conflict } from '@application/errors/common';
import { LessonNotFound, ModuleNotFound } from '@application/errors/outline';
import type { CourseOutlineQuery } from '@application/queries/outline/CourseOutlineQuery';
import type { LessonRepository } from '@application/repositories/outline/LessonRepository';
import type { ModuleRepository } from '@application/repositories/outline/ModuleRepository';

const copyModule = (module: Module): Module =>
  new Module({
    id: module.id,
    courseId: module.courseId,
    title: module.title,
    position: module.position,
  });

const copyLesson = (lesson: Lesson): Lesson =>
  new Lesson({
    id: lesson.id,
    courseId: lesson.courseId,
    moduleId: lesson.moduleId,
    title: lesson.title,
    body: lesson.body,
    durationMinutes: lesson.durationMinutes,
    position: lesson.position,
  });

// Modules and lessons kept apart from the use case's objects, as a table would.
export class InMemoryModuleRepository implements ModuleRepository {
  readonly modules = new Map<Module.Id, Module>();

  findById(_courseId: Course.Id, id: Module.Id): Promise<Module | null> {
    const module = this.modules.get(id);

    return Promise.resolve(module ? copyModule(module) : null);
  }

  createOperation(module: Module): UnitOfWork.Operation {
    return InMemoryUnitOfWork.operation({
      apply: () => this.modules.set(module.id, copyModule(module)),
    });
  }

  renameOperation(module: Module): UnitOfWork.Operation {
    return this.changeOf(module, new ModuleNotFound());
  }

  deleteOperation(module: Module): UnitOfWork.Operation {
    return InMemoryUnitOfWork.operation({
      check: () =>
        this.modules.has(module.id) ? undefined : new ModuleNotFound(),
      apply: () => this.modules.delete(module.id),
    });
  }

  repositionOperation(module: Module): UnitOfWork.Operation {
    return this.changeOf(module, new Conflict());
  }

  private changeOf(module: Module, missing: Error): UnitOfWork.Operation {
    return InMemoryUnitOfWork.operation({
      check: () => (this.modules.has(module.id) ? undefined : missing),
      apply: () => this.modules.set(module.id, copyModule(module)),
    });
  }
}

export class InMemoryLessonRepository implements LessonRepository {
  readonly lessons = new Map<Lesson.Id, Lesson>();

  findById(
    _courseId: Course.Id,
    moduleId: Module.Id,
    id: Lesson.Id,
  ): Promise<Lesson | null> {
    const lesson = this.lessons.get(id);

    return Promise.resolve(
      lesson?.moduleId === moduleId ? copyLesson(lesson) : null,
    );
  }

  createOperations(lesson: Lesson): UnitOfWork.Operation[] {
    return [
      InMemoryUnitOfWork.operation({
        apply: () => this.lessons.set(lesson.id, copyLesson(lesson)),
      }),
    ];
  }

  updateOperations(lesson: Lesson): UnitOfWork.Operation[] {
    return [this.changeOf(lesson, new LessonNotFound())];
  }

  deleteOperations(lesson: Lesson): UnitOfWork.Operation[] {
    return [
      InMemoryUnitOfWork.operation({
        check: () =>
          this.lessons.has(lesson.id) ? undefined : new LessonNotFound(),
        apply: () => this.lessons.delete(lesson.id),
      }),
    ];
  }

  repositionOperation(lesson: Lesson): UnitOfWork.Operation {
    return this.changeOf(lesson, new Conflict());
  }

  // Two operations, as the table needs: one for the old key, one for the new.
  moveOperations(lesson: Lesson): UnitOfWork.Operation[] {
    return [
      InMemoryUnitOfWork.operation({
        check: () => (this.lessons.has(lesson.id) ? undefined : new Conflict()),
        apply: () => undefined,
      }),
      this.changeOf(lesson, new Conflict()),
    ];
  }

  private changeOf(lesson: Lesson, missing: Error): UnitOfWork.Operation {
    return InMemoryUnitOfWork.operation({
      check: () => (this.lessons.has(lesson.id) ? undefined : missing),
      apply: () => this.lessons.set(lesson.id, copyLesson(lesson)),
    });
  }
}

export class InMemoryCourseOutlineQuery implements CourseOutlineQuery {
  constructor(
    private readonly modules: InMemoryModuleRepository,
    private readonly lessons: InMemoryLessonRepository,
  ) {}

  execute(courseId: Course.Id): Promise<CourseOutlineQuery.Outline> {
    const byPosition = (
      a: { position: number; id: string },
      b: { position: number; id: string },
    ) => a.position - b.position || a.id.localeCompare(b.id);
    const modules = [...this.modules.modules.values()]
      .filter((module) => module.courseId === courseId)
      .map((module) => ({
        id: module.id,
        title: module.title,
        position: module.position,
        lessons: [...this.lessons.lessons.values()]
          .filter((lesson) => lesson.moduleId === module.id)
          .map(({ id, title, durationMinutes, position }) => ({
            id,
            title,
            durationMinutes,
            position,
          }))
          .sort(byPosition),
      }))
      .sort(byPosition);

    return Promise.resolve({ modules });
  }
}
