import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import fsdRules from './.kiro/eslint/fsd-rules.js';

export default tseslint.config(
  { ignores: ['dist', '.kiro/templates/**'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx,js,jsx}'], // ✅ Added .js and .jsx
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import': importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Catch undefined variables
      'no-undef': 'error',
      'no-unused-vars': 'warn',

      // Import/Export validation
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-duplicates': 'warn',

      // RBAC canonical-type guard (spec: rbac-architecture-violations-fix, task 6.4 / FC-2).
      // `UserRole` must be declared (as a `type` alias) in EXACTLY ONE module —
      // src/shared/types/generated/roles.ts. Everywhere else it must be re-exported or
      // imported. This selector bans a genuine `type UserRole = ...` alias declaration;
      // it does NOT match `export type { UserRole } from '...'` or imports. The block
      // below re-enables (turns off) the rule for the canonical generated module.
      'no-restricted-syntax': [
        'error',
        {
          selector: "TSTypeAliasDeclaration[id.name='UserRole']",
          message:
            "`UserRole` may only be declared in src/shared/types/generated/roles.ts. " +
            "Re-export it (`export type { UserRole } from '@/shared/types/generated/roles'`) " +
            'or use `SchoolInternalRole` for the school-internal taxonomy.',
        },
      ],
    },
  },
  // Allow the canonical declaration of `UserRole` ONLY in the generated module.
  // Placed after the base block so it overrides the no-restricted-syntax rule there.
  {
    files: ['src/shared/types/generated/roles.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  // FSD Architecture compliance rules
  fsdRules
);
