import type { UnitOfWork } from '@application/contracts/UnitOfWork';
import { Course } from '@application/entities/Course';
import type { Lesson } from '@application/entities/Lesson';
import type { Module } from '@application/entities/Module';
import { LessonNotFound } from '@application/errors/LessonNotFound';
import type { CourseRepository } from '@application/repositories/CourseRepository';
import type { LessonRepository } from '@application/repositories/LessonRepository';
import type { CourseEditor } from '@application/usecases/outline/CourseEditor';

export class DeleteLessonUseCase {
  constructor(
    private readonly coursesRepository: CourseRepository,
    private readonly lessonsRepository: LessonRepository,
    private readonly unitOfWork: UnitOfWork.Factory,
  ) {}

  async execute({
    callerId,
    callerRole,
    courseId,
    moduleId,
    lessonId,
  }: DeleteLessonUseCase.Input): Promise<void> {
    const found = await this.coursesRepository.findById(courseId);
    const course = Course.requireFound(found);
    course.requireEditableBy(callerId, callerRole);
    course.requireDraft();
    const lesson = await this.lessonsRepository.findById(
      courseId,
      moduleId,
      lessonId,
    );

    if (!lesson) {
      throw new LessonNotFound();
    }

    const unit = this.unitOfWork();
    unit.add(
      ...this.lessonsRepository.deleteOperations(lesson),
      this.coursesRepository.addLessonsOperation(course, -1),
    );
    await unit.commit();
  }
}

export namespace DeleteLessonUseCase {
  export interface Input extends CourseEditor {
    courseId: Course.Id;
    moduleId: Module.Id;
    lessonId: Lesson.Id;
  }
}
