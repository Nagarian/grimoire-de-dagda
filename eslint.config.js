import eslint from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactJsxRuntime from 'eslint-plugin-react/configs/jsx-runtime.js'
import reactRecommended from 'eslint-plugin-react/configs/recommended.js'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: ['eslint.config.js', 'vite.config.ts', 'dist/', 'public/'],
  },
  {
    // files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'simple-import-sort': simpleImportSort,
    },
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactRecommended,
      reactJsxRuntime,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [['^node:', '^@?\\w', '^', '^\\.', '^\\u0000']],
        },
      ],
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
        },
      ],
    },
  },
])
