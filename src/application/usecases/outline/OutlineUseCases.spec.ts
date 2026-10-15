import { beforeEach, describe, expect, it } from 'vitest';

import { outlineWorld } from '@tests/outlineWorld';

import { Lesson } from '@application/entities/Lesson';
import { Module } from '@application/entities/Module';
import { CourseNotFound } from '@application/errors/course';
import { OutlineMismatch, OutlineTooLarge } from '@application/errors/outline';
import { GetCourseOutlineUseCase } from '@application/usecases/outline/GetCourseOutlineUseCase';
import { ReorderOutlineUseCase } from '@application/usecases/outline/ReorderOutlineUseCase';

let world: Awaited<ReturnType<typeof outlineWorld>>;
let reorder: ReorderOutlineUseCase;
let read: GetCourseOutlineUseCase;
let m1: Module;
let m2: Module;
let lessons: Lesson[];

const addModule = (title: string, position: number) => {
  const module = Module.create({ courseId: world.course.id, title, position });
  world.modules.modules.set(module.id, module);

  return module;
};

const addLesson = (module: Module, position: number) => {
  const lesson = Lesson.create({
    courseId: world.course.id,
    moduleId: module.id,
    title: `L${String(position)}`,
    body: '',
    durationMinutes: 5,
    position,
  });
  world.lessons.lessons.set(lesson.id, lesson);

  return lesson;
};

beforeEach(async () => {
  world = await outlineWorld();
  const { courses, modules, outline, unitOfWork } = world;
  reorder = new ReorderOutlineUseCase(
    courses,
    modules,
    world.lessons,
    outline,
    unitOfWork,
  );
  read = new GetCourseOutlineUseCase(courses, outline);
  m1 = addModule('M1', 0);
  m2 = addModule('M2', 1);
  lessons = [addLesson(m1, 0), addLesson(m1, 1), addLesson(m2, 0)];
});

describe('outline use cases', () => {
  it('should swap modules and move a lesson to another module', async () => {
    const [a, b, c] = lessons as [Lesson, Lesson, Lesson];

    await reorder.execute({
      ...world.as(world.owner),
      modules: [
        { id: m2.id, lessonIds: [c.id, a.id] },
        { id: m1.id, lessonIds: [b.id] },
      ],
    });

    const { modules } = await read.execute(world.as(world.owner));
    expect(modules.map((m) => [m.id, m.lessons.map((l) => l.id)])).toEqual([
      [m2.id, [c.id, a.id]],
      [m1.id, [b.id]],
    ]);
  });

  it('should refuse an outline that leaves out or repeats an item', async () => {
    const [a, b, c] = lessons as [Lesson, Lesson, Lesson];
    const missing = [
      { id: m1.id, lessonIds: [a.id, b.id] },
      { id: m2.id, lessonIds: [] },
    ];
    const repeated = [
      { id: m1.id, lessonIds: [a.id, b.id, c.id] },
      { id: m2.id, lessonIds: [c.id] },
    ];

    for (const modules of [missing, repeated]) {
      await expect(
        reorder.execute({ ...world.as(world.owner), modules }),
      ).rejects.toBeInstanceOf(OutlineMismatch);
    }
  });

  it('should refuse an outline that moves more than one transaction holds', async () => {
    const many = Array.from({ length: 60 }, (_, i) => addLesson(m1, i + 2));
    const fromM1 = [...lessons.slice(0, 2), ...many].map((l) => l.id);
    const fromM2 = lessons.slice(2).map((l) => l.id);

    await expect(
      reorder.execute({
        ...world.as(world.owner),
        modules: [
          { id: m1.id, lessonIds: [] },
          { id: m2.id, lessonIds: [...fromM1, ...fromM2] },
        ],
      }),
    ).rejects.toBeInstanceOf(OutlineTooLarge);
  });

  it('should hide the outline of a draft from another instructor', async () => {
    await expect(read.execute(world.as(world.other))).rejects.toBeInstanceOf(
      CourseNotFound,
    );
  });
});
