import { describe, expect, it } from 'vitest';

import { Account } from '@application/entities/Account';
import { Course } from '@application/entities/Course';
import { CourseItem } from '@infra/database/dynamo/items/CourseItem';

const instructor = Account.create({ name: 'Ana', email: 'ana@example.com' });

describe('CourseItem', () => {
  it('should build the table key and the instructor index key', () => {
    const course = Course.create({
      instructor,
      title: ' DynamoDB ',
      description: 'Keys and indexes',
    });

    expect(CourseItem.fromEntity(course).toItem()).toMatchObject({
      PK: `COURSE#${course.id}`,
      SK: `COURSE#${course.id}`,
      GSI1PK: `INSTRUCTOR#${instructor.id}`,
      GSI1SK: `COURSE#${course.id}`,
      type: 'Course',
      title: 'DynamoDB',
      instructorName: 'Ana',
      status: 'DRAFT',
      lessonCount: 0,
      enrollmentCount: 0,
    });
  });

  it('should read back the same course it wrote', () => {
    const course = Course.create({ instructor, title: 'T', description: '' });

    expect(CourseItem.toEntity(CourseItem.fromEntity(course).toItem())).toEqual(
      course,
    );
  });
});
