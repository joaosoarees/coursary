import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import { Course } from '@application/entities/course/Course';
import { Lesson } from '@application/entities/outline/Lesson';
import { Module } from '@application/entities/outline/Module';
import { OutlineMismatch, OutlineTooLarge } from '@application/errors/outline';
import type { CourseOutlineQuery } from '@application/queries/outline/CourseOutlineQuery';
import type { CourseRepository } from '@application/repositories/course/CourseRepository';
import type { LessonRepository } from '@application/repositories/outline/LessonRepository';
import type { ModuleRepository } from '@application/repositories/outline/ModuleRepository';
import type { CourseEditor } from '@application/usecases/course/CourseEditor';

export class ReorderOutlineUseCase {
  static readonly maxOperations = 100;

  constructor(
    private readonly coursesRepository: CourseRepository,
    private readonly modulesRepository: ModuleRepository,
    private readonly lessonsRepository: LessonRepository,
    private readonly courseOutline: CourseOutlineQuery,
    private readonly unitOfWork: UnitOfWork.Factory,
  ) {}

  async execute({
    callerId,
    callerRole,
    courseId,
    modules: order,
  }: ReorderOutlineUseCase.Input): Promise<CourseOutlineQuery.Outline> {
    const found = await this.coursesRepository.findById(courseId);
    const course = Course.requireFound(found);
    course.requireEditableBy(callerId, callerRole);
    const current = await this.courseOutline.execute(courseId);
    ReorderOutlineUseCase.requireSameItems(current, order);

    const modulesById = new Map(current.modules.map((m) => [m.id, m]));
    const lessonsById = new Map(
      current.modules.flatMap((m) =>
        m.lessons.map((l) => [l.id, { ...l, moduleId: m.id }] as const),
      ),
    );
    const operations: UnitOfWork.Operation[] = [];
    const reordered: CourseOutlineQuery.Module[] = [];

    for (const [position, entry] of order.entries()) {
      const stored = modulesById.get(entry.id);

      if (!stored) {
        throw new OutlineMismatch();
      }

      if (stored.position !== position) {
        const module = new Module({
          id: entry.id,
          courseId,
          title: stored.title,
          position,
        });
        operations.push(this.modulesRepository.repositionOperation(module));
      }

      const lessons: CourseOutlineQuery.Lesson[] = [];

      for (const [lessonPosition, lessonId] of entry.lessonIds.entries()) {
        const summary = lessonsById.get(lessonId);

        if (!summary) {
          throw new OutlineMismatch();
        }

        // Only the summary moves; the body stays in its own item (Q72).
        const lesson = new Lesson({
          id: lessonId,
          courseId,
          moduleId: entry.id,
          title: summary.title,
          body: '',
          durationMinutes: summary.durationMinutes,
          position: lessonPosition,
        });

        if (summary.moduleId !== entry.id) {
          operations.push(
            ...this.lessonsRepository.moveOperations(
              lesson,
              Module.toId(summary.moduleId),
            ),
          );
        } else if (summary.position !== lessonPosition) {
          operations.push(this.lessonsRepository.repositionOperation(lesson));
        }

        lessons.push({
          id: lessonId,
          title: summary.title,
          durationMinutes: summary.durationMinutes,
          position: lessonPosition,
        });
      }

      reordered.push({ id: entry.id, title: stored.title, position, lessons });
    }

    if (operations.length + 1 > ReorderOutlineUseCase.maxOperations) {
      throw new OutlineTooLarge();
    }

    if (operations.length > 0) {
      const unit = this.unitOfWork();
      unit.add(
        ...operations,
        this.coursesRepository.statusUnchangedOperation(course),
      );
      await unit.commit();
    }

    return { modules: reordered };
  }

  // The outline only reorders: every module and lesson, each once (Q229).
  private static requireSameItems(
    current: CourseOutlineQuery.Outline,
    order: ReorderOutlineUseCase.Input['modules'],
  ): void {
    const sameSet = (stored: string[], sent: string[]) =>
      stored.length === sent.length &&
      new Set(sent).size === sent.length &&
      sent.every((id) => stored.includes(id));
    const storedLessons = current.modules.flatMap((m) =>
      m.lessons.map((l) => l.id),
    );
    const sentLessons = order.flatMap((m) => m.lessonIds);

    if (
      !sameSet(
        current.modules.map((m) => m.id),
        order.map((m) => m.id),
      ) ||
      !sameSet(storedLessons, sentLessons)
    ) {
      throw new OutlineMismatch();
    }
  }
}

export namespace ReorderOutlineUseCase {
  export interface Input extends CourseEditor {
    courseId: Course.Id;
    modules: { id: Module.Id; lessonIds: Lesson.Id[] }[];
  }
}
