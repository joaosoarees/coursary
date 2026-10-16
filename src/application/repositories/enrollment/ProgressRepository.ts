import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import type { LessonProgress } from '@application/entities/enrollment/LessonProgress';

export interface ProgressRepository {
  // Fails with AlreadyCompleted when the lesson was completed before.
  completeOperation(progress: LessonProgress): UnitOfWork.Operation;
}
