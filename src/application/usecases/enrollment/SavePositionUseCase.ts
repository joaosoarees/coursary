import { Course } from '@application/entities/course/Course';
import { CoursePosition } from '@application/entities/enrollment/CoursePosition';
import type { Lesson } from '@application/entities/outline/Lesson';
import type { CourseRepository } from '@application/repositories/course/CourseRepository';
import type { EnrollmentRepository } from '@application/repositories/enrollment/EnrollmentRepository';
import type { ProgressRepository } from '@application/repositories/enrollment/ProgressRepository';
import type { CourseEditor } from '@application/usecases/course/CourseEditor';

export class SavePositionUseCase {
  constructor(
    private readonly coursesRepository: CourseRepository,
    private readonly enrollmentsRepository: EnrollmentRepository,
    private readonly progressRepository: ProgressRepository,
  ) {}

  // Called every 15 to 30 s: a read and a put, no transaction; the lesson id
  // is only stored (Q55, Q280).
  async execute({
    callerId,
    callerRole,
    courseId,
    lessonId,
    positionSeconds,
  }: SavePositionUseCase.Input): Promise<void> {
    const [found, stored] = await Promise.all([
      this.coursesRepository.findById(courseId),
      this.enrollmentsRepository.find(callerId, courseId),
    ]);
    const course = Course.requireFound(found);
    course.requireEnrolledIn(callerId, callerRole, stored);

    await this.progressRepository.savePosition(
      CoursePosition.create({
        accountId: callerId,
        courseId,
        lessonId,
        positionSeconds,
      }),
    );
  }
}

export namespace SavePositionUseCase {
  export interface Input extends CourseEditor {
    courseId: Course.Id;
    lessonId: Lesson.Id;
    positionSeconds: number;
  }
}
