import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import type { Account } from '@application/entities/account/Account';
import type { Course } from '@application/entities/course/Course';

export interface CourseRepository {
  create(course: Course): Promise<void>;

  findById(id: Course.Id): Promise<Course | null>;

  update(id: Course.Id, changes: Course.Changes): Promise<Course>;

  publish(id: Course.Id, publishedAt: Date): Promise<Course>;

  archive(id: Course.Id): Promise<Course>;

  updateInstructorName(instructorId: Account.Id, name: string): Promise<void>;

  // Holds the transaction to the status the caller checked.
  statusUnchangedOperation(course: Course): UnitOfWork.Operation;

  addLessonsOperation(course: Course, delta: number): UnitOfWork.Operation;
}
