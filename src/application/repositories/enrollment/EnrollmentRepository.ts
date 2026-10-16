import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import type { Account } from '@application/entities/account/Account';
import type { Course } from '@application/entities/course/Course';
import type { Enrollment } from '@application/entities/enrollment/Enrollment';

export interface EnrollmentRepository {
  find(
    accountId: Account.Id,
    courseId: Course.Id,
    options?: EnrollmentRepository.ReadOptions,
  ): Promise<Enrollment | null>;

  createOperation(enrollment: Enrollment): UnitOfWork.Operation;

  reactivateOperation(enrollment: Enrollment): UnitOfWork.Operation;

  cancelOperation(enrollment: Enrollment): UnitOfWork.Operation;

  updateStudentName(accountId: Account.Id, name: string): Promise<void>;
}

export namespace EnrollmentRepository {
  export interface ReadOptions {
    consistent?: boolean;
  }
}
