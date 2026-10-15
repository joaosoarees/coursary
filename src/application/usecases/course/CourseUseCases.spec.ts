import { beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';
import { InMemoryCourseRepository } from '@tests/fakes/InMemoryCourseRepository';

import { Account, accountRoles } from '@application/entities/Account';
import { Course } from '@application/entities/Course';
import { AccountUnavailable } from '@application/errors/auth';
import { Forbidden } from '@application/errors/common';
import { CourseArchived, CourseNotFound } from '@application/errors/course';
import { UpdateMeUseCase } from '@application/usecases/account/UpdateMeUseCase';
import { CreateCourseUseCase } from '@application/usecases/course/CreateCourseUseCase';
import { UpdateCourseUseCase } from '@application/usecases/course/UpdateCourseUseCase';

let accounts: InMemoryAccountRepository;
let courses: InMemoryCourseRepository;
let owner: Account;
let other: Account;
let admin: Account;
let course: Course;

const addAccount = async (name: string, role: Account.Role) => {
  const account = Account.create({ name, email: `${name}@example.com` });
  await accounts.create(account);
  account.activate();
  account.role = role;

  return account;
};

beforeEach(async () => {
  accounts = new InMemoryAccountRepository();
  courses = new InMemoryCourseRepository();
  owner = await addAccount('ana', accountRoles.Instructor);
  other = await addAccount('bia', accountRoles.Instructor);
  admin = await addAccount('caio', accountRoles.Admin);
  course = Course.create({ instructor: owner, title: 'T', description: '' });
  await courses.create(course);
});

const update = (caller: Account, title = 'New') =>
  new UpdateCourseUseCase(courses).execute({
    callerId: caller.id,
    callerRole: caller.role,
    courseId: course.id,
    changes: { title },
  });

describe('CreateCourseUseCase', () => {
  it('should create a draft owned by the caller, with the caller name', async () => {
    const created = await new CreateCourseUseCase(accounts, courses).execute({
      callerId: owner.id,
      title: ' DynamoDB ',
      description: 'Keys',
    });

    expect(created).toMatchObject({
      instructorId: owner.id,
      instructorName: 'ana',
      title: 'DynamoDB',
      status: 'DRAFT',
      lessonCount: 0,
      publishedAt: null,
    });
    expect(courses.courses.size).toBe(2);
  });

  it('should refuse an account that is not active', async () => {
    owner.status = 'DISABLED';

    await expect(
      new CreateCourseUseCase(accounts, courses).execute({
        callerId: owner.id,
        title: 'T',
        description: '',
      }),
    ).rejects.toBeInstanceOf(AccountUnavailable);
  });
});

describe('UpdateCourseUseCase', () => {
  it('should let the owner change the course', async () => {
    await expect(update(owner)).resolves.toMatchObject({ title: 'New' });
  });

  it('should let an admin change any course', async () => {
    await expect(update(admin)).resolves.toMatchObject({ title: 'New' });
  });

  it('should hide a draft of another instructor (404)', async () => {
    await expect(update(other)).rejects.toBeInstanceOf(CourseNotFound);
  });

  it('should refuse a visible course of another instructor (403)', async () => {
    course.status = 'PUBLISHED';

    await expect(update(other)).rejects.toBeInstanceOf(Forbidden);
  });

  it('should refuse an archived course, also to an admin', async () => {
    course.status = 'ARCHIVED';

    await expect(update(owner)).rejects.toBeInstanceOf(CourseArchived);
    await expect(update(admin)).rejects.toBeInstanceOf(CourseArchived);
  });
});

describe('UpdateMeUseCase and the courses', () => {
  it('should copy a new name into the courses of the instructor', async () => {
    await new UpdateMeUseCase(accounts, courses).execute({
      accountId: owner.id,
      name: 'Ana Souza',
    });

    expect(course.instructorName).toBe('Ana Souza');
  });
});
