import nextTypescript from "eslint-config-next/typescript";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  ...nextTypescript,
  ...nextCoreWebVitals,
  ...compat.extends("eslint:recommended"),
  ...compat.extends("plugin:@typescript-eslint/recommended"),
  ...compat.extends("plugin:react/recommended"),
  ...compat.extends("plugin:react/jsx-runtime"),
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: await import('@typescript-eslint/parser').then((m) => m.default),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': await import('@typescript-eslint/eslint-plugin').then((m) => m.default),
      react: await import('eslint-plugin-react').then((m) => m.default),
      'react-you-might-not-need-an-effect': await import('eslint-plugin-react-you-might-not-need-an-effect').then(
        (m) => m.default,
      ),
    },
    rules: {
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'dist/**', '.cache/**', '*.config.js', '*.config.ts'],
  }
];

export default eslintConfig;
