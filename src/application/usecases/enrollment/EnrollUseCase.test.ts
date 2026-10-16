import { beforeEach, describe, expect, test } from 'vitest';

import { uniqueEmail } from '@tests/support/accountWorld';
import { courseWorld } from '@tests/support/courseWorld';

import { Account } from '@application/entities/account/Account';
import { CourseArchived, CourseNotFound } from '@application/errors/course';
import { OwnCourse } from '@application/errors/enrollment';
import { CancelEnrollmentUseCase } from '@application/usecases/enrollment/CancelEnrollmentUseCase';
import { EnrollUseCase } from '@application/usecases/enrollment/EnrollUseCase';

let world: Awaited<ReturnType<typeof courseWorld>>;
let enroll: EnrollUseCase;
let cancel: CancelEnrollmentUseCase;
let student: Account;

beforeEach(async () => {
  world = await courseWorld();
  enroll = new EnrollUseCase(
    world.courses,
    world.enrollments,
    world.unitOfWork,
  );
  cancel = new CancelEnrollmentUseCase(
    world.courses,
    world.enrollments,
    world.unitOfWork,
  );
  student = Account.create({ name: 'Duda', email: uniqueEmail('duda') });
  await world.setCourse({ status: 'PUBLISHED' });
});

const enrollStudent = () =>
  enroll.execute({ student, courseId: world.course.id });

const enrollmentCount = async () =>
  (await world.storedCourse())?.enrollmentCount;

describe('EnrollUseCase', () => {
  test('enrolls once, copies the name and counts the student', async () => {
    const { enrollment, created } = await enrollStudent();

    expect(created).toBe(true);
    expect(enrollment).toMatchObject({
      courseId: world.course.id,
      status: 'ACTIVE',
      completedLessons: 0,
    });
    await expect(
      world.enrollments.find(student.id, world.course.id),
    ).resolves.toMatchObject({ studentName: 'Duda' });
    await expect(enrollmentCount()).resolves.toBe(1);
  });

  test('answers an active enrollment again without writing', async () => {
    const first = await enrollStudent();

    const again = await enrollStudent();

    expect(again).toEqual({ enrollment: first.enrollment, created: false });
    await expect(enrollmentCount()).resolves.toBe(1);
  });

  test('enrolls again after cancelling, keeping the first date', async () => {
    const first = await enrollStudent();
    await cancel.execute({ studentId: student.id, courseId: world.course.id });

    const again = await enrollStudent();

    expect(again.created).toBe(false);
    expect(again.enrollment).toEqual(first.enrollment);
    await expect(enrollmentCount()).resolves.toBe(1);
  });

  test('refuses the owner of the course', async () => {
    await expect(
      enroll.execute({ student: world.owner, courseId: world.course.id }),
    ).rejects.toBeInstanceOf(OwnCourse);
  });

  test('hides a draft and refuses an archived course', async () => {
    await world.setCourse({ status: 'DRAFT' });
    await expect(enrollStudent()).rejects.toBeInstanceOf(CourseNotFound);

    await world.setCourse({ status: 'ARCHIVED' });
    await expect(enrollStudent()).rejects.toBeInstanceOf(CourseArchived);
    await expect(enrollmentCount()).resolves.toBe(0);
  });
});
