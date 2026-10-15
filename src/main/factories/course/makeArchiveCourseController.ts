import { ArchiveCourseController } from '@application/controllers/course/ArchiveCourseController';
import { ArchiveCourseUseCase } from '@application/usecases/course/ArchiveCourseUseCase';
import { makeCourseRepository } from '@main/factories/makeCourseRepository';

export function makeArchiveCourseController(): ArchiveCourseController {
  const coursesRepository = makeCourseRepository();
  const useCase = new ArchiveCourseUseCase(coursesRepository);

  return new ArchiveCourseController(useCase);
}
