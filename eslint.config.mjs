import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier: prettier,
      import: importPlugin,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...typescript.configs['recommended-requiring-type-checking'].rules,
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-var-requires': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off',
      'prettier/prettier': 'error',
      
      // Module Boundary Rules
      'import/no-restricted-paths': [
        'error',
        {
          // Apps cannot import from other apps
          zones: [
            {
              target: './apps/*',
              from: './apps/*',
              except: ['./apps/*/src/**'],
              message: 'Apps cannot import from other apps. Use shared libraries instead.',
            },
            // Apps can only import from libs public APIs
            {
              target: './apps/*',
              from: './libs/*/src/**',
              except: ['./libs/*/src/index.ts'],
              message: 'Apps must import from lib public APIs (index.ts) only.',
            },
            // Libs cannot import from apps
            {
              target: './libs/*',
              from: './apps/*',
              message: 'Libraries cannot import from apps. This creates circular dependencies.',
            },
            // Libs cannot import from other libs internal modules
            {
              target: './libs/*',
              from: './libs/*/src/**',
              except: ['./libs/*/src/index.ts', './libs/shared-types/src/**'],
              message: 'Libraries must import from other libs public APIs (index.ts) only.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/**/*', 'node_modules/**/*', '**/*.js'],
  },
];
