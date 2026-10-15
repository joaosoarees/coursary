export type Constructor<T = unknown> = new (...args: never[]) => T;

export type AbstractConstructor<T = unknown> = abstract new (
  ...args: never[]
) => T;

export type Token<T = unknown> = Constructor<T> | AbstractConstructor<T>;
