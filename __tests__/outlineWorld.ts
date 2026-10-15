import { InMemoryAccountRepository } from '@tests/fakes/InMemoryAccountRepository';
import { InMemoryCourseRepository } from '@tests/fakes/InMemoryCourseRepository';
import {
  InMemoryCourseOutlineQuery,
  InMemoryLessonRepository,
  InMemoryModuleRepository,
} from '@tests/fakes/InMemoryOutline';
import { InMemoryUnitOfWork } from '@tests/fakes/InMemoryUnitOfWork';

import { Account, accountRoles } from '@application/entities/Account';
import { Course } from '@application/entities/Course';

// A course with its owner, another instructor and an admin, all in memory.
export async function outlineWorld() {
  const accounts = new InMemoryAccountRepository();
  const courses = new InMemoryCourseRepository();
  const modules = new InMemoryModuleRepository();
  const lessons = new InMemoryLessonRepository();
  const outline = new InMemoryCourseOutlineQuery(modules, lessons);
  const unitOfWork = () => new InMemoryUnitOfWork();
  const addAccount = async (name: string, role: Account.Role) => {
    const account = Account.create({ name, email: `${name}@example.com` });
    await accounts.create(account);
    account.activate();
    account.role = role;

    return account;
  };
  const owner = await addAccount('ana', accountRoles.Instructor);
  const other = await addAccount('bia', accountRoles.Instructor);
  const admin = await addAccount('caio', accountRoles.Admin);
  const course = Course.create({
    instructor: owner,
    title: 'T',
    description: '',
  });
  await courses.create(course);
  const as = (account: Account) => ({
    callerId: account.id,
    callerRole: account.role,
    courseId: course.id,
  });

  return {
    courses,
    modules,
    lessons,
    outline,
    unitOfWork,
    owner,
    other,
    admin,
    course,
    as,
  };
}
