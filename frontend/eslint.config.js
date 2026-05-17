import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // React
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/prop-types': 'off',
      'react/no-unknown-property': 'error',

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // a11y
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/anchor-is-valid': 'warn',

      // TypeScript
      // `any` and unused-vars are demoted to warn while a baseline of pre-existing
      // violations is paid down. New code shows the warning loud and clear.
      // Flip both back to "error" once the backlog is cleared (tracked in plan).
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

      // The React/JSX text quoting and unused-expression rules surface a backlog
      // of pre-existing style nits. Demote to warn so new violations are visible
      // without blocking CI on the backlog.
      'react/no-unescaped-entities': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',

      // Custom guard: ban `var(--token)<digits>` concatenation, the exact bug
      // that shipped invisibly in Loading.tsx (`var(--accent)20`). Browsers
      // drop the declaration silently. Use color-mix() instead.
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/var\\(--[^)]+\\)\\d/]",
          message:
            'Invalid CSS: var(--token) cannot be concatenated with a number. Use color-mix(in srgb, var(--token) N%, transparent) instead.',
        },
        {
          selector: "TemplateElement[value.raw=/var\\(--[^)]+\\)\\d/]",
          message:
            'Invalid CSS: var(--token) cannot be concatenated with a number. Use color-mix(in srgb, var(--token) N%, transparent) instead.',
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**'],
    languageOptions: {
      globals: {
        ...globals.node,
        vi: 'readonly',
      },
    },
  },
  {
    files: ['scripts/**/*.{js,mjs,ts}', '*.config.{js,mjs,ts}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettier,
);
