import 'reflect-metadata';

import type { ZodType } from 'zod';

const SCHEMA_METADATA_KEY = Symbol('controller:schema');

export interface SchemaParams {
  body?: ZodType;
}

export function Schema(schema: SchemaParams): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(SCHEMA_METADATA_KEY, schema, target);
  };
}

export function getSchema(instance: object): SchemaParams | undefined {
  return Reflect.getMetadata(SCHEMA_METADATA_KEY, instance.constructor) as
    SchemaParams | undefined;
}
