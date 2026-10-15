import path from 'node:path';

import { defineConfig } from 'vitest/config';

const src = (folder: string) =>
  path.resolve(import.meta.dirname, 'src', folder);

export default defineConfig({
  test: {
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@application': src('application'),
      '@infra': src('infra'),
      '@kernel': src('kernel'),
      '@main': src('main'),
      '@shared': src('shared'),
    },
  },
});
