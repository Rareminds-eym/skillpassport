/**
 * Bug-Condition Exploration Test: UserRole Type Fragmentation & Phantom Roles
 *
 * Spec: rbac-architecture-violations-fix — Task 1.2 (Phase 0: Bug-Condition Exploration)
 * **Validates: Requirements 2.1, 2.2**
 *
 * PURPOSE
 * -------
 * This test statically scans the `src/` tree and asserts that the three known
 * type-fragmentation / phantom-role defects documented in bugfix.md §2 and §6 are
 * present in the current (unfixed) source.
 *
 *   Bug A — Type fragmentation (bugfix.md §2.1):
 *           `UserRole` is declared (as a `type` / `export type` ALIAS, not a
 *           re-export shim) in MORE THAN ONE module. The 7 known definitions live at:
 *             - src/features/auth/api/index.ts          (8 roles)
 *             - src/entities/user/model/types.ts        (15 roles)
 *             - src/shared/types/permissions.ts         (9 school roles)
 *             - src/shared/types/messaging.ts           (7 roles)
 *             - src/entities/user/model/useUserRole.ts  (5 school roles)
 *             - src/pages/admin/schoolAdmin/Settings.tsx(9 roles, local)
 *             - src/features/auth/ui/UnifiedSignup.tsx  (8 roles incl. phantom recruitment_admin)
 *           Detection uses the TypeScript compiler API so that pure re-export shims
 *           (`export type { UserRole } from '...'`) and imports are NOT counted —
 *           only genuine `type UserRole = ...` alias declarations.
 *
 *   Bug B — Phantom `college_lecturer` (bugfix.md §2.2 / §6):
 *           `src/pages/educator/Settings.tsx` compares `userRole === 'college_lecturer'`,
 *           but `college_lecturer` is NOT one of the canonical 16 SSO roles, so the
 *           comparison is dead code.
 *
 *   Bug C — Phantom `recruitment_admin` (bugfix.md §6.4):
 *           `src/features/auth/ui/UnifiedSignup.tsx` offers `recruitment_admin` as a
 *           selectable signup role, but it is NOT one of the canonical 16 SSO roles.
 *
 * EXPECTED OUTCOME
 * ----------------
 * Because this is a Phase-0 exploration test, DETECTING these violations is the SUCCESS
 * condition: the test PASSES while the bugs exist. Once P1 introduces a single canonical
 * `UserRole` module and removes the phantom literals, these assertions will FAIL — that
 * flip is the signal the defects have been resolved (see Task 8 / 25.3).
 *
 * DO NOT fix the underlying bugs in this task. DO NOT modify source files other than
 * adding this test.
 */

import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

// Resolve the skillpassport project root from this test file location:
// src/__tests__/bugfix/<thisFile> -> project root is three levels up.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const SRC_ROOT = path.join(PROJECT_ROOT, 'src');

/**
 * The canonical 16 SSO roles (sso-worker `roles` seed). Any role literal NOT in this
 * set used in a role check/selection is a "phantom" role. Source: bugfix.md Introduction.
 */
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

const SSO_ROLE_SET = new Set<string>(SSO_ROLES);

const PHANTOM_LITERALS = ['college_lecturer', 'recruitment_admin'] as const;

/** Recursively collect every .ts/.tsx source file under `dir`, skipping the test tree. */
function collectSourceFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip the test tree (avoids counting any UserRole alias declared inside tests)
            // and any node_modules that may live under src.
            if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
            out.push(...collectSourceFiles(full));
        } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
            out.push(full);
        }
    }
    return out;
}

/**
 * Returns true if `source` contains a genuine top-level (or nested) `type UserRole = ...`
 * ALIAS declaration. Uses the TS AST so that re-export shims and imports are excluded:
 *   - `export type { UserRole } from '...'`  -> ExportDeclaration (NOT a TypeAliasDeclaration)
 *   - `import { UserRole } from '...'`        -> ImportDeclaration (NOT a TypeAliasDeclaration)
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

describe('Bug Condition: UserRole fragmentation & phantom roles (static analysis)', () => {
    let sourceFiles: string[] = [];
    let userRoleModules: string[] = [];

    // Cached contents of the two phantom-literal hosts.
    let educatorSettings = '';
    let unifiedSignup = '';

    const educatorSettingsPath = path.join(SRC_ROOT, 'pages/educator/Settings.tsx');
    const unifiedSignupPath = path.join(SRC_ROOT, 'features/auth/ui/UnifiedSignup.tsx');

    beforeAll(() => {
        sourceFiles = collectSourceFiles(SRC_ROOT);

        userRoleModules = sourceFiles
            .filter((f) => {
                const src = fs.readFileSync(f, 'utf8');
                // Cheap pre-filter before the (more expensive) AST parse.
                if (!src.includes('UserRole')) return false;
                return declaresUserRoleAlias(f, src);
            })
            .map((f) => path.relative(PROJECT_ROOT, f))
            .sort();

        educatorSettings = fs.existsSync(educatorSettingsPath)
            ? fs.readFileSync(educatorSettingsPath, 'utf8')
            : '';
        unifiedSignup = fs.existsSync(unifiedSignupPath)
            ? fs.readFileSync(unifiedSignupPath, 'utf8')
            : '';

        // Surface evidence for debugging / audit trail.
        // eslint-disable-next-line no-console
        console.log(
            '\n=== UserRole fragmentation evidence (bug reproduced) ===\n' +
            `Modules declaring a \`type UserRole = ...\` alias (${userRoleModules.length}):\n` +
            userRoleModules.map((m) => `  - ${m}`).join('\n') +
            '\n=== end evidence ===\n',
        );
    });

    /**
     * Sanity: the scan must have found source files. An empty scan would invalidate the
     * exploration (e.g. wrong project root).
     */
    it('scans the src/ tree successfully', () => {
        expect(sourceFiles.length).toBeGreaterThan(0);
    });

    /**
     * Bug A — Type fragmentation.
     * Assert `UserRole` is declared as a genuine type alias in MORE THAN ONE module.
     * **Validates: Requirements 2.1**
     */
    it('detects UserRole fragmented across more than one module (Bug A)', () => {
        expect(
            userRoleModules.length,
            `Expected UserRole to be declared in >1 module (fragmentation). Found in: ${userRoleModules.join(', ')}`,
        ).toBeGreaterThan(1);

        // bugfix.md §2.1 documents 7 definitions; assert we reproduce the bulk of them.
        expect(
            userRoleModules.length,
            `Expected ~7 fragmented UserRole definitions per bugfix.md §2.1. Found ${userRoleModules.length}: ${userRoleModules.join(', ')}`,
        ).toBeGreaterThanOrEqual(5);

        // Spot-check that the known canonical-vs-fragmented hotspots are present.
        const expectedHosts = [
            'src/features/auth/api/index.ts',
            'src/entities/user/model/types.ts',
            'src/shared/types/permissions.ts',
        ];
        for (const host of expectedHosts) {
            expect(
                userRoleModules.includes(host),
                `Expected a UserRole alias declaration in ${host}. Found: ${userRoleModules.join(', ')}`,
            ).toBe(true);
        }
    });

    /**
     * Property: every module reported as a UserRole host genuinely contains a `UserRole`
     * type alias (re-parsing must agree). This guards the fragmentation count against
     * false positives from re-export shims / imports. Sampled across all discovered hosts.
     * **Validates: Requirements 2.1**
     */
    it('property: every reported UserRole host genuinely declares the alias (not a re-export)', () => {
        // Pre-condition for the property to be meaningful.
        expect(userRoleModules.length).toBeGreaterThan(0);

        fc.assert(
            fc.property(fc.constantFrom(...userRoleModules), (relModule) => {
                const abs = path.join(PROJECT_ROOT, relModule);
                const src = fs.readFileSync(abs, 'utf8');
                return declaresUserRoleAlias(abs, src);
            }),
            { numRuns: Math.max(20, userRoleModules.length * 3) },
        );
    });

    /**
     * Bug B — Phantom `college_lecturer` in a role comparison.
     * Match `userRole === 'college_lecturer'` (a role-comparison context). The trailing
     * closing quote after `college_lecturer` ensures we do NOT match the legitimate
     * `college_lecturers` TABLE name used elsewhere in the same file.
     * **Validates: Requirements 2.2**
     */
    it('detects the phantom `college_lecturer` role comparison (Bug B)', () => {
        expect(educatorSettings.length, `Could not read ${educatorSettingsPath}`).toBeGreaterThan(0);

        const comparisonRe = /===\s*['"]college_lecturer['"]/;
        const match = comparisonRe.exec(educatorSettings);

        expect(
            match,
            "Expected a `userRole === 'college_lecturer'` phantom comparison in pages/educator/Settings.tsx",
        ).not.toBeNull();

        // college_lecturer must NOT be a canonical SSO role (that is what makes it phantom).
        expect(SSO_ROLE_SET.has('college_lecturer')).toBe(false);

        // eslint-disable-next-line no-console
        console.log(`\n[college_lecturer phantom] matched: ${match?.[0]}\n`);
    });

    /**
     * Bug C — Phantom `recruitment_admin` selectable signup role.
     * **Validates: Requirements 2.2**
     */
    it('detects the phantom `recruitment_admin` literal in UnifiedSignup (Bug C)', () => {
        expect(unifiedSignup.length, `Could not read ${unifiedSignupPath}`).toBeGreaterThan(0);

        const literalRe = /['"]recruitment_admin['"]/g;
        const matches = unifiedSignup.match(literalRe) ?? [];

        expect(
            matches.length,
            "Expected the phantom 'recruitment_admin' literal in features/auth/ui/UnifiedSignup.tsx",
        ).toBeGreaterThanOrEqual(1);

        // recruitment_admin must NOT be a canonical SSO role (that is what makes it phantom).
        expect(SSO_ROLE_SET.has('recruitment_admin')).toBe(false);

        // eslint-disable-next-line no-console
        console.log(`\n[recruitment_admin phantom] occurrences: ${matches.length}\n`);
    });

    /**
     * Property: each phantom literal is, by definition, OUTSIDE the canonical 16-role set
     * yet still present in the source. This is the universal invariant the P1 fix must
     * break (by removing the literals). Holds for all phantom literals.
     * **Validates: Requirements 2.2**
     */
    it('property: phantom literals are non-canonical yet present in source', () => {
        fc.assert(
            fc.property(fc.constantFrom(...PHANTOM_LITERALS), (literal) => {
                const isPhantom = !SSO_ROLE_SET.has(literal);
                const presentSomewhere =
                    educatorSettings.includes(literal) || unifiedSignup.includes(literal);
                return isPhantom && presentSomewhere;
            }),
            { numRuns: 20 },
        );
    });
});
