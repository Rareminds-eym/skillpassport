/**
 * Regression Guard: `UserRole` has a single canonical declaration site.
 *
 * Spec: rbac-architecture-violations-fix — Task 6.4 (Phase P1)
 * **Validates: Requirements 2.1**
 *
 * PURPOSE
 * -------
 * This is the INVERSE of the Phase-0 exploration test
 * (`src/__tests__/bugfix/typeFragmentationAndPhantomRoles.bugCondition.test.ts`,
 * task 1.2). Where that test asserts fragmentation EXISTS (a genuine
 * `type UserRole = ...` alias declared in MORE THAN ONE module), this test
 * asserts the FIXED invariant (design Property 2 / FC-2):
 *
 *   `UserRole` is declared (as a genuine `type` / `export type` ALIAS) in
 *   EXACTLY ONE module — `src/shared/types/generated/roles.ts` — and every
 *   other module re-exports or imports it.
 *
 * It uses the same TypeScript-compiler-API detection technique as the 1.2 test
 * so that pure re-export shims (`export type { UserRole } from '...'`) and
 * imports (`import type { UserRole } from '...'`) are NOT counted — only real
 * `type UserRole = ...` alias declarations.
 *
 * EXPECTED OUTCOME
 * ----------------
 * This test PASSES on the post-6.1–6.3 source and must stay green going
 * forward. It is a durable regression guard, NOT an exploration test: any
 * future reintroduction of a second `UserRole` declaration (re-fragmentation)
 * will turn it red. The CI drift check (task 18.2) provides a second line of
 * defence once the generator lands.
 */

import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

// Resolve the skillpassport project root from this test file location:
// src/__tests__/rbac/<thisFile> -> project root is three levels up.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const SRC_ROOT = path.join(PROJECT_ROOT, 'src');

/** The one and only module allowed to declare a `UserRole` type alias. */
const CANONICAL_MODULE = 'src/shared/types/generated/roles.ts';

/** The canonical 16 SSO roles (sso-worker `roles` seed). Source: bugfix.md / generated module. */
const SSO_ROLES = [
    'owner',
    'admin',
    'member',
    'super_admin',
    'rm_admin',
    'rm_manager',
    'company_admin',
    'educator',
    'school_educator',
    'college_educator',
    'school_admin',
    'college_admin',
    'university_admin',
    'recruiter',
    'hr',
    'learner',
] as const;

/**
 * The seven modules that historically declared their own `UserRole` union
 * (bugfix.md §2.1). Post-fix, NONE of them may declare a `UserRole` alias —
 * they must re-export it, import it, or (for the school-internal taxonomy) use
 * `SchoolInternalRole` instead.
 */
const FORMER_HOST_MODULES = [
    'src/features/auth/api/index.ts',
    'src/entities/user/model/types.ts',
    'src/shared/types/messaging.ts',
    'src/pages/admin/schoolAdmin/Settings.tsx',
    'src/features/auth/ui/UnifiedSignup.tsx',
    'src/shared/types/permissions.ts',
    'src/entities/user/model/useUserRole.ts',
] as const;

/** Recursively collect every .ts/.tsx source file under `dir`, skipping the test tree. */
function collectSourceFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip the test tree so we do NOT match `type UserRole = ...` strings that
            // live INSIDE the exploration tests; also skip any nested node_modules.
            if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
            out.push(...collectSourceFiles(full));
        } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
            out.push(full);
        }
    }
    return out;
}

/**
 * Returns true if `source` contains a genuine `type UserRole = ...` ALIAS
 * declaration. Uses the TS AST so that re-export shims and imports are excluded:
 *   - `export type { UserRole } from '...'`  -> ExportDeclaration (NOT counted)
 *   - `import { UserRole } from '...'`        -> ImportDeclaration (NOT counted)
 *   - `type UserRole = '...' | '...'`         -> TypeAliasDeclaration (COUNTED)
 */
function declaresUserRoleAlias(filePath: string, source: string): boolean {
    const scriptKind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, scriptKind);

    let found = false;
    const visit = (node: ts.Node): void => {
        if (found) return;
        if (ts.isTypeAliasDeclaration(node) && node.name.text === 'UserRole') {
            found = true;
            return;
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
    return found;
}

describe('Canonical UserRole: single declaration site (regression guard, FC-2)', () => {
    let sourceFiles: string[] = [];
    let userRoleDeclModules: string[] = [];

    beforeAll(() => {
        sourceFiles = collectSourceFiles(SRC_ROOT);

        userRoleDeclModules = sourceFiles
            .filter((f) => {
                const src = fs.readFileSync(f, 'utf8');
                // Cheap pre-filter before the (more expensive) AST parse.
                if (!src.includes('UserRole')) return false;
                return declaresUserRoleAlias(f, src);
            })
            .map((f) => path.relative(PROJECT_ROOT, f).split(path.sep).join('/'))
            .sort();

        // Surface evidence for the audit trail.
        // eslint-disable-next-line no-console
        console.log(
            '\n=== Canonical UserRole evidence (post-fix) ===\n' +
            `Modules declaring a \`type UserRole = ...\` alias (${userRoleDeclModules.length}):\n` +
            userRoleDeclModules.map((m) => `  - ${m}`).join('\n') +
            '\n=== end evidence ===\n',
        );
    });

    /** Sanity: an empty scan would invalidate the guard (e.g. wrong project root). */
    it('scans the src/ tree successfully', () => {
        expect(sourceFiles.length).toBeGreaterThan(0);
    });

    /**
     * Core invariant (FC-2): `UserRole` is declared as a genuine type alias in
     * EXACTLY ONE module, and that module is the generated canonical one.
     * **Validates: Requirements 2.1**
     */
    it('declares UserRole in exactly one module — the generated canonical module', () => {
        expect(
            userRoleDeclModules,
            `Expected exactly one \`type UserRole = ...\` declaration (in ${CANONICAL_MODULE}). ` +
            `Found ${userRoleDeclModules.length}: ${userRoleDeclModules.join(', ') || '(none)'}`,
        ).toEqual([CANONICAL_MODULE]);
    });

    /**
     * Property: none of the seven former host modules declares a `UserRole`
     * alias anymore — each must re-export it, import it, or use
     * `SchoolInternalRole` for the school-internal taxonomy.
     * **Validates: Requirements 2.1**
     */
    it('property: no former host module redeclares a UserRole alias', () => {
        fc.assert(
            fc.property(fc.constantFrom(...FORMER_HOST_MODULES), (relModule) => {
                const abs = path.join(PROJECT_ROOT, relModule);
                // The module must still exist; if it does, it must NOT declare the alias.
                if (!fs.existsSync(abs)) return false;
                const src = fs.readFileSync(abs, 'utf8');
                return declaresUserRoleAlias(abs, src) === false;
            }),
            { numRuns: Math.max(20, FORMER_HOST_MODULES.length * 3) },
        );
    });

    /**
     * Property: re-parsing the single reported declaration site genuinely
     * contains the alias (guards against a false single-match from a shim/import
     * being miscounted). Also confirms the canonical module file exists.
     * **Validates: Requirements 2.1**
     */
    it('property: the canonical module genuinely declares the UserRole alias', () => {
        const canonicalAbs = path.join(PROJECT_ROOT, CANONICAL_MODULE);
        expect(fs.existsSync(canonicalAbs), `Missing canonical module ${CANONICAL_MODULE}`).toBe(true);

        fc.assert(
            fc.property(fc.constant(CANONICAL_MODULE), (relModule) => {
                const abs = path.join(PROJECT_ROOT, relModule);
                const src = fs.readFileSync(abs, 'utf8');
                return declaresUserRoleAlias(abs, src);
            }),
            { numRuns: 20 },
        );
    });

    /**
     * Light supporting check: the canonical module derives `UserRole` from the
     * 16-role `SSO_ROLES` tuple (`(typeof SSO_ROLES)[number]`). This is not the
     * primary invariant (single-declaration is), just a guard that the single
     * site remains the SSO-derived union rather than an ad-hoc literal union.
     * **Validates: Requirements 2.1**
     */
    it('canonical UserRole derives from the 16-role SSO_ROLES tuple', () => {
        const canonicalAbs = path.join(PROJECT_ROOT, CANONICAL_MODULE);
        const src = fs.readFileSync(canonicalAbs, 'utf8');

        // UserRole is derived from the SSO_ROLES tuple, not a hand-written union.
        expect(src).toMatch(/export\s+type\s+UserRole\s*=\s*\(typeof\s+SSO_ROLES\)\[number\]/);

        // SSO_ROLES lists exactly the 16 canonical roles.
        for (const role of SSO_ROLES) {
            expect(src, `Expected canonical role '${role}' in SSO_ROLES`).toContain(`'${role}'`);
        }
    });
});
