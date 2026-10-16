import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import type { Course } from '@application/entities/course/Course';
import type { Module } from '@application/entities/outline/Module';

export interface ModuleRepository {
  findById(courseId: Course.Id, id: Module.Id): Promise<Module | null>;

  createOperation(module: Module): UnitOfWork.Operation;

  renameOperation(module: Module): UnitOfWork.Operation;

  deleteOperation(module: Module): UnitOfWork.Operation;

  repositionOperation(module: Module): UnitOfWork.Operation;
}
