import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const forbiddenImports = {
  kernel: ['application', 'infra', 'main', 'shared'],
  shared: ['application', 'infra', 'main'],
  application: ['infra', 'main'],
  infra: ['main'],
};

const layerRules = Object.entries(forbiddenImports).map(
  ([layer, forbidden]) => ({
    files: [`src/${layer}/**/*.ts`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: forbidden.map((target) => ({
            group: [`@${target}/*`],
            message: `The ${layer} layer must not import from ${target}.`,
          })),
        },
      ],
    },
  }),
);

export default defineConfig([
  { ignores: ['node_modules/', '.serverless/'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: { allowDefaultProject: ['vitest.config.ts'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^node:'],
            ['^@?\\w'],
            ['^@(application|infra|kernel|main|shared)/'],
            ['^\\.'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  ...layerRules,
  prettier,
]);
