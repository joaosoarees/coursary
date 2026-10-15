import type { Account } from '@application/entities/Account';
import type { Course } from '@application/entities/Course';

export interface CourseRepository {
  create(course: Course): Promise<void>;

  findById(id: Course.Id): Promise<Course | null>;

  update(id: Course.Id, changes: Course.Changes): Promise<Course>;

  updateInstructorName(instructorId: Account.Id, name: string): Promise<void>;
}
