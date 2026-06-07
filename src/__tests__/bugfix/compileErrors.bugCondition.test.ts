/**
 * Bug-Condition Exploration Test: Compile-Breaking RBAC Violations
 *
 * Spec: rbac-architecture-violations-fix — Task 1.1 (Phase 0: Bug-Condition Exploration)
 * **Validates: Requirements 1.1, 1.2, 1.3**
 *
 * PURPOSE
 * -------
 * This test runs the project's TypeScript type-check (`tsc --noEmit -p tsconfig.app.json`)
 * and asserts that the THREE known compile-breaking bugs documented in bugfix.md §1 are
 * present in the current (unfixed) source tree.
 *
 *   Bug 1 — Broken `@/shared/types` barrel:
 *           `src/entities/user/model/validation.ts` and `.../utils.ts` import
 *           `User`, `UserRole`, `CreateUserData`, `UpdateUserData` from `@/shared/types`,
 *           but `src/shared/types/index.ts` exports none of them (6 errors).
 *
 *   Bug 2 — `RecruitmentRole` not exported:
 *           5 org-recruitment UI files import `type { RecruitmentRole }` from
 *           `@/entities/recruitment/model/types`, which never exports it.
 *
 *   Bug 3 — `authStore.ts` self-import:
 *           `src/shared/model/authStore.ts` imports `useAuthStore` from itself,
 *           conflicting with its own local declaration (TS2440 / TS2395).
 *
 * EXPECTED OUTCOME
 * ----------------
 * Because this is a Phase-0 exploration test, DETECTING these errors is the SUCCESS
 * condition: the test PASSES while the bugs exist (the assertions confirm the error
 * messages are present in the compiler output). Once the bugs are fixed in P0, these
 * specific errors disappear and this test will FAIL — that flip is the signal the
 * defects have been resolved (see Task 5.1 / 25.3).
 *
 * NOTE: The skillpassport tree currently has many unrelated type errors. This test does
 * NOT assert a specific total error count; it asserts ONLY that the three targeted
 * bug signatures appear in the output.
 *
 * DO NOT fix the underlying bugs in this task. DO NOT modify source files other than
 * adding this test.
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

// Resolve the skillpassport project root from this test file location:
// src/__tests__/bugfix/<thisFile> -> project root is three levels up.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

/**
 * Runs `tsc --noEmit -p tsconfig.app.json` and returns the combined stdout/stderr.
 * `tsc` exits non-zero when there are type errors, so execFileSync throws; we capture
 * the output from the thrown error object in that case.
 */
function runTypeCheck(): string {
    try {
        const out = execFileSync(
            'npx',
            ['tsc', '--noEmit', '-p', 'tsconfig.app.json', '--pretty', 'false'],
            {
                cwd: PROJECT_ROOT,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
                maxBuffer: 64 * 1024 * 1024, // tsc output here is large (~8k errors)
            },
        );
        // No type errors at all (clean compile) — capture whatever was emitted.
        return String(out ?? '');
    } catch (err: unknown) {
        const e = err as { stdout?: Buffer | string; stderr?: Buffer | string };
        const stdout = e?.stdout ? e.stdout.toString() : '';
        const stderr = e?.stderr ? e.stderr.toString() : '';
        return `${stdout}\n${stderr}`;
    }
}

describe('Bug Condition: RBAC compile-breaking violations (tsc --noEmit)', () => {
    let output = '';
    let lines: string[] = [];

    beforeAll(() => {
        output = runTypeCheck();
        lines = output.split(/\r?\n/);

        // Surface a focused view of the targeted errors for debugging / evidence.
        const targeted = lines.filter(
            (l) =>
                /entities[\\/]user[\\/]model[\\/](validation|utils)\.ts.*@\/shared\/types/.test(l) ||
                /no exported member 'RecruitmentRole'/.test(l) ||
                /authStore\.ts.*useAuthStore/.test(l),
        );
        // eslint-disable-next-line no-console
        console.log(
            '\n=== Targeted compile-error evidence (bug reproduced) ===\n' +
            targeted.join('\n') +
            '\n=== end evidence ===\n',
        );
    });

    /**
     * Sanity: the type-checker must have produced output. If this is empty the test
     * environment could not invoke tsc, which would invalidate the exploration.
     */
    it('produces type-checker output', () => {
        expect(output.trim().length).toBeGreaterThan(0);
    });

    /**
     * Bug 1 — Broken `@/shared/types` barrel.
     * Assert the specific "no exported member" errors for User / UserRole / CreateUserData /
     * UpdateUserData, originating from entities/user/model/validation.ts and utils.ts.
     * **Validates: Requirements 1.1**
     */
    it('detects the broken @/shared/types barrel (Bug 1)', () => {
        const barrelMembers = ['User', 'UserRole', 'CreateUserData', 'UpdateUserData'];

        // Lines reporting a missing @/shared/types export coming from the user-entity model files.
        const barrelErrorLines = lines.filter(
            (l) =>
                /entities[\\/]user[\\/]model[\\/](validation|utils)\.ts/.test(l) &&
                /Module '"@\/shared\/types"' has no exported member '(User|UserRole|CreateUserData|UpdateUserData)'/.test(
                    l,
                ),
        );

        // Each of the four members should be reported missing at least once from these files.
        for (const member of barrelMembers) {
            const re = new RegExp(
                `entities[\\\\/]user[\\\\/]model[\\\\/](validation|utils)\\.ts.*has no exported member '${member}'`,
            );
            expect(
                barrelErrorLines.some((l) => re.test(l)),
                `Expected a "@/shared/types has no exported member '${member}'" error from entities/user/model`,
            ).toBe(true);
        }

        // bugfix.md §1 documents 6 such errors across validation.ts + utils.ts.
        expect(barrelErrorLines.length).toBeGreaterThanOrEqual(6);
    });

    /**
     * Bug 2 — `RecruitmentRole` not exported from @/entities/recruitment/model/types.
     * **Validates: Requirements 1.2**
     */
    it('detects the missing RecruitmentRole export (Bug 2)', () => {
        const recruitmentRoleErrors = lines.filter((l) =>
            /Module '"@\/entities\/recruitment\/model\/types"' has no exported member 'RecruitmentRole'/.test(
                l,
            ),
        );

        expect(
            recruitmentRoleErrors.length,
            "Expected at least one \"no exported member 'RecruitmentRole'\" error",
        ).toBeGreaterThanOrEqual(1);

        // The known importers per bugfix.md §1.2.
        const expectedImporters = [
            'ChangeRoleModal.tsx',
            'EmployeeList.tsx',
            'InvitationsList.tsx',
            'InviteEmployeeModal.tsx',
        ];
        const importersHit = expectedImporters.filter((file) =>
            recruitmentRoleErrors.some((l) => l.includes(file)),
        );
        expect(
            importersHit.length,
            `Expected RecruitmentRole errors from org-recruitment UI files. Hit: ${importersHit.join(', ')}`,
        ).toBeGreaterThanOrEqual(1);
    });

    /**
     * Bug 3 — `authStore.ts` self-import conflicts with its local `useAuthStore` declaration.
     * tsc reports TS2440 (import conflicts with local declaration) and/or TS2395
     * (merged declaration must be all exported or all local).
     * **Validates: Requirements 1.3**
     */
    it('detects the authStore.ts self-import conflict (Bug 3)', () => {
        const authStoreLines = lines.filter((l) => /shared[\\/]model[\\/]authStore\.ts/.test(l));

        const hasImportConflict = authStoreLines.some(
            (l) =>
                /TS2440/.test(l) &&
                /Import declaration conflicts with local declaration of 'useAuthStore'/.test(l),
        );
        const hasMergedDeclarationError = authStoreLines.some(
            (l) => /TS2395/.test(l) && /useAuthStore/.test(l),
        );

        expect(
            hasImportConflict || hasMergedDeclarationError,
            `Expected authStore.ts self-import conflict (TS2440/TS2395 on 'useAuthStore'). authStore lines: ${authStoreLines.join(' | ')}`,
        ).toBe(true);
    });
});
