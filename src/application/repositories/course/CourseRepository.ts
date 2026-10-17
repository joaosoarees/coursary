import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import type { Account } from '@application/entities/account/Account';
import type { Course } from '@application/entities/course/Course';

export interface CourseRepository {
  // Without a description, nothing is stored for it (Q307).
  create: (course: Course, description?: string) => Promise<void>;

  findById: (
    id: Course.Id,
    options?: CourseRepository.ReadOptions,
  ) => Promise<Course | null>;

  findDescription: (
    id: Course.Id,
    options?: CourseRepository.ReadOptions,
  ) => Promise<string>;

  update: (course: Course, changes: Course.Changes) => Promise<void>;

  publish: (id: Course.Id, publishedAt: Date) => Promise<Course>;

  archive: (id: Course.Id) => Promise<Course>;

  updateInstructorName: (
    instructorId: Account.Id,
    name: string,
  ) => Promise<void>;

  // Holds the transaction to the status the caller checked.
  statusUnchangedOperation: (course: Course) => UnitOfWork.Operation;

  addLessonsOperation: (course: Course, delta: number) => UnitOfWork.Operation;

  // A new or renewed enrollment needs a published course; leaving one does not.
  addEnrollmentsOperation: (
    course: Course,
    delta: number,
    options: CourseRepository.EnrollmentCountOptions,
  ) => UnitOfWork.Operation;

  addRatingsOperation: (
    course: Course,
    deltas: CourseRepository.RatingDeltas,
  ) => UnitOfWork.Operation;
}

export namespace CourseRepository {
  export interface ReadOptions {
    consistent?: boolean;
  }

  // Named, so a sum and a count cannot trade places.
  export interface RatingDeltas {
    sumDelta: number;
    countDelta: number;
  }

  export interface EnrollmentCountOptions {
    requirePublished: boolean;
  }
}
