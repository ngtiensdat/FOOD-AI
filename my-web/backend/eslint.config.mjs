// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      'unused-imports': unusedImports,
      'boundaries': boundaries,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'boundaries/elements': [
        { type: 'common', pattern: 'src/common/*' },
        { type: 'database', pattern: 'src/database/*' },
        { type: 'modules', pattern: 'src/modules/*' },
      ],
    },
    rules: {
      // General Strict Rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unused-vars': 'off', // Handle by unused-imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],
      "prettier/prettier": ["error", { endOfLine: "auto" }],

      // Boundary Rules
      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          rules: [
            { target: 'src/modules/**/*', allow: ['index.ts', '*.module.ts', '*.controller.ts', '*.service.ts', 'dto/*.ts', 'repositories/*.ts'] },
          ],
        },
      ],
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          message: '${file.type} is not allowed to import ${dependency.type}',
          rules: [
            {
              from: 'modules',
              disallow: ['modules'], // Prevent cross-module imports (should use SharedModule)
              message: 'Modules should not import from other modules directly. Use SharedModule or proper DI.'
            },
          ],
        },
      ],
    },
  },
);
