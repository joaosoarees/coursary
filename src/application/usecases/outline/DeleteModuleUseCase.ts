import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import { Course } from '@application/entities/Course';
import type { Module } from '@application/entities/Module';
import { ModuleNotEmpty } from '@application/errors/ModuleNotEmpty';
import { ModuleNotFound } from '@application/errors/ModuleNotFound';
import type { CourseOutlineQuery } from '@application/queries/CourseOutlineQuery';
import type { CourseRepository } from '@application/repositories/CourseRepository';
import type { ModuleRepository } from '@application/repositories/ModuleRepository';
import type { CourseEditor } from '@application/usecases/outline/CourseEditor';

export class DeleteModuleUseCase {
  constructor(
    private readonly coursesRepository: CourseRepository,
    private readonly modulesRepository: ModuleRepository,
    private readonly courseOutline: CourseOutlineQuery,
    private readonly unitOfWork: UnitOfWork.Factory,
  ) {}

  async execute({
    callerId,
    callerRole,
    courseId,
    moduleId,
  }: DeleteModuleUseCase.Input): Promise<void> {
    const found = await this.coursesRepository.findById(courseId);
    const course = Course.requireFound(found);
    course.requireEditableBy(callerId, callerRole);
    course.requireDraft();
    const module = await this.modulesRepository.findById(courseId, moduleId);

    if (!module) {
      throw new ModuleNotFound();
    }

    const { modules } = await this.courseOutline.execute(courseId);
    const lessons = modules.find((m) => m.id === moduleId)?.lessons ?? [];

    if (lessons.length > 0) {
      throw new ModuleNotEmpty();
    }

    const unit = this.unitOfWork();
    unit.add(
      this.modulesRepository.deleteOperation(module),
      this.coursesRepository.statusUnchangedOperation(course),
    );
    await unit.commit();
  }
}

export namespace DeleteModuleUseCase {
  export interface Input extends CourseEditor {
    courseId: Course.Id;
    moduleId: Module.Id;
  }
}
