import 'reflect-metadata';

import type { Constructor, Token } from '@kernel/di/types';

const NOT_A_CLASS: unknown[] = [Object, String, Number, Boolean, Array, Symbol];

export class Registry {
  private static instance: Registry | undefined;

  static getInstance(): Registry {
    Registry.instance ??= new Registry();

    return Registry.instance;
  }

  private readonly bindings = new Map<Token, Constructor>();

  private readonly instances = new Map<Token, unknown>();

  register<T>(implementation: Constructor<T>): void {
    this.bind(implementation, implementation);
  }

  bind<T>(token: Token<T>, implementation: Constructor<T>): void {
    if (this.bindings.has(token)) {
      throw new Error(`${token.name} is already registered.`);
    }

    this.bindings.set(token, implementation);
  }

  resolve<T>(token: Token<T>): T {
    return this.resolveWithPath(token, []);
  }

  private resolveWithPath<T>(token: Token<T>, path: Token[]): T {
    const cached = this.instances.get(token);

    if (cached !== undefined) {
      return cached as T;
    }

    if (path.includes(token)) {
      const cycle = [...path, token].map(({ name }) => name).join(' -> ');
      throw new Error(`Circular dependency: ${cycle}.`);
    }

    const implementation = this.bindings.get(token);

    if (!implementation) {
      const requiredBy = path.at(-1);
      throw new Error(
        requiredBy
          ? `${token.name} is not registered (required by ${requiredBy.name}).`
          : `${token.name} is not registered.`,
      );
    }

    const parameterTypes = (Reflect.getOwnMetadata(
      'design:paramtypes',
      implementation,
    ) ?? []) as unknown[];

    if (parameterTypes.length < implementation.length) {
      throw new Error(
        `${implementation.name} has no constructor type metadata: is emitDecoratorMetadata on and is the class decorated?`,
      );
    }

    const dependencies = parameterTypes.map((type, index) => {
      if (typeof type !== 'function' || NOT_A_CLASS.includes(type)) {
        throw new Error(
          `Parameter ${String(index)} of ${implementation.name} is not a class and cannot be injected.`,
        );
      }

      return this.resolveWithPath(type as Token, [...path, token]);
    });

    const instance = new implementation(...(dependencies as never[])) as T;
    this.instances.set(token, instance);

    return instance;
  }
}
