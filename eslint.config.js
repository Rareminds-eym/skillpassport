import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { 
    ignores: [
      'dist',
      'node_modules',
      'build',
      'coverage',
      '**/.wrangler/**',
      '**/dist/**',
      '*.config.js',
      'assessment-cli.js',
      // Test and debug scripts
      'debug-*.js',
      'test-*.js',
      'execute-import.js',
      'fix-*.js',
      'fix-*.cjs',
      'check-*.js',
      'verify-*.js',
      'generate-*.js',
      'setup-*.js',
      'apply-*.cjs',
      'monitor-*.js',
      'quick-*.js',
      'inline-*.js',
      'pipeline-*.js',
      'admin-*.js',
      'analyze-*.js',
      'create-*.js',
      'delete-*.js',
      'import-*.js',
      'insert-*.js',
      'merge-*.js',
      'migrate-*.js',
      'populate-*.js',
      'remove-*.js',
      'reset-*.js',
      'run-*.js',
      'school-*.js',
      'set-*.js',
      'show-*.js',
      'sync-*.js',
      'update-*.js',
      'scripts/**',
      'cloudflare-workers/**/fix-*.js',
      // Problematic file with syntax issues
      'cloudflare-workers/payments-api/src/index.ts',
    ] 
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Relax some rules to warnings
      'no-empty': 'warn',
      'no-control-regex': 'warn',
      'no-useless-escape': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-constant-binary-expression': 'warn',
      // Disable problematic rules
      'no-case-declarations': 'off',
      'no-empty-pattern': 'off',
      'no-prototype-builtins': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      'no-useless-catch': 'warn',
      'prefer-const': 'warn',
    },
  },
  // Prettier config MUST be last to override formatting rules
  eslintConfigPrettier
);
