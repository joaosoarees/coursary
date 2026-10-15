import { describe, expect, it } from 'vitest';

import { Injectable } from '@kernel/decorators/Injectable';
import { Registry } from '@kernel/di/Registry';

abstract class Clock {
  abstract now(): number;
}

class FixedClock extends Clock {
  now() {
    return 42;
  }
}

function Decorated(): ClassDecorator {
  return () => undefined;
}

@Decorated()
class Greeter {
  constructor(readonly clock: Clock) {}
}

@Decorated()
class Uses {
  constructor(readonly greeter: Greeter) {}
}

class First {
  constructor(readonly second: unknown) {}
}

class Second {
  constructor(readonly first: unknown) {}
}

Reflect.defineMetadata('design:paramtypes', [Second], First);
Reflect.defineMetadata('design:paramtypes', [First], Second);

@Decorated()
class TakesAString {
  constructor(readonly name: string) {}
}

class NotDecorated {
  constructor(readonly clock: Clock) {}
}

describe('Registry', () => {
  it('should read constructor types emitted by the test runner', () => {
    expect(Reflect.getOwnMetadata('design:paramtypes', Greeter)).toEqual([
      Clock,
    ]);
  });

  it('should resolve an abstract class to the implementation bound to it', () => {
    const registry = new Registry();
    registry.bind(Clock, FixedClock);
    registry.register(Greeter);

    expect(registry.resolve(Greeter).clock.now()).toBe(42);
  });

  it('should share one instance of each class', () => {
    const registry = new Registry();
    registry.bind(Clock, FixedClock);
    registry.register(Greeter);
    registry.register(Uses);

    expect(registry.resolve(Uses).greeter).toBe(registry.resolve(Greeter));
  });

  it('should refuse to register a token twice', () => {
    const registry = new Registry();
    registry.bind(Clock, FixedClock);

    expect(() => {
      registry.bind(Clock, FixedClock);
    }).toThrow('Clock is already registered.');
  });

  it('should name the class that required a missing dependency', () => {
    const registry = new Registry();
    registry.register(Greeter);

    expect(() => registry.resolve(Greeter)).toThrow(
      'Clock is not registered (required by Greeter).',
    );
  });

  it('should describe a circular dependency', () => {
    const registry = new Registry();
    registry.register(First);
    registry.register(Second);

    expect(() => registry.resolve(First)).toThrow(
      'Circular dependency: First -> Second -> First.',
    );
  });

  it('should refuse a parameter that is not a class', () => {
    const registry = new Registry();
    registry.register(TakesAString);

    expect(() => registry.resolve(TakesAString)).toThrow(
      'Parameter 0 of TakesAString is not a class and cannot be injected.',
    );
  });

  it('should refuse a class without constructor type metadata', () => {
    const registry = new Registry();
    registry.bind(Clock, FixedClock);
    registry.register(NotDecorated);

    expect(() => registry.resolve(NotDecorated)).toThrow(
      'NotDecorated has no constructor type metadata',
    );
  });

  it('should register a class decorated with Injectable in the shared registry', () => {
    @Injectable()
    class Standalone {
      readonly name = 'standalone';
    }

    expect(Registry.getInstance().resolve(Standalone)).toBeInstanceOf(
      Standalone,
    );
  });
});
