import { describe, expect, it } from 'vitest';

import { Account } from '@application/entities/account/Account';
import { Course } from '@application/entities/course/Course';
import { Lesson } from '@application/entities/outline/Lesson';
import { Module } from '@application/entities/outline/Module';
import { LessonContentItem } from '@infra/database/dynamo/items/outline/LessonContentItem';
import { LessonItem } from '@infra/database/dynamo/items/outline/LessonItem';
import { ModuleItem } from '@infra/database/dynamo/items/outline/ModuleItem';

const instructor = Account.create({ name: 'Ana', email: 'ana@example.com' });
const course = Course.create({ instructor, title: 'T', description: '' });
const module = Module.create({
  courseId: course.id,
  title: ' Intro ',
  position: 0,
});
const lesson = Lesson.create({
  courseId: course.id,
  moduleId: module.id,
  title: 'Keys',
  body: '# Keys',
  durationMinutes: 10,
  position: 0,
});

describe('outline items', () => {
  it('should keep modules and lesson summaries in the course partition', () => {
    expect(ModuleItem.fromEntity(module).toItem()).toMatchObject({
      PK: `COURSE#${course.id}`,
      SK: `MODULE#${module.id}`,
      title: 'Intro',
      type: 'Module',
    });
    expect(LessonItem.fromEntity(lesson).toItem()).toMatchObject({
      PK: `COURSE#${course.id}`,
      SK: `MODULE#${module.id}#LESSON#${lesson.id}`,
      type: 'Lesson',
    });
  });

  it('should keep the lesson body out of the course partition', () => {
    expect(LessonItem.fromEntity(lesson).toItem()).not.toHaveProperty('body');
    expect(LessonContentItem.fromEntity(lesson).toItem()).toMatchObject({
      PK: `LESSON#${lesson.id}`,
      SK: 'CONTENT',
      body: '# Keys',
      type: 'LessonContent',
    });
  });
});
