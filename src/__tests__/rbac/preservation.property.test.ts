/**
 * Behavior-Preservation tests for the RBAC migration (Phase P2 GATE).
 *
 * Spec: rbac-architecture-violations-fix — Task 14.2 (Phase P2 gate)
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * Design: Property 10 (Behavior preserved) · PC-1..PC-5 · Testing Strategy
 *         "Preservation tests".
 *
 * WHY THIS EXISTS
 * ---------------
 * The P0–P2 refactors (de-shadowing authz, deriving auth-store booleans from
 * `ROLE_CATEGORIES`, converting inline admin literals to a shared group) MUST
 * PRESERVE behavior: for the SAME inputs, routing, admin-authorization, the
 * primary-role selection (`pickPrimaryRole`), and the auth-store role helpers
 * must return IDENTICAL results to the pre-migration code. This file locks the
 * legacy ("golden") behavior in as explicit constants so any future drift fails.
 *
 *   PC-1 — routing: `ProtectedRoute.getRoleCategory` mapping unchanged.
 *   PC-2 — admin authorization: the shared admin group equals the historical
 *          inline admin literal set (no role added/removed).
 *   PC-3 — `pickPrimaryRole` priority selection unchanged.
 *   PC-4 — auth-store role helpers (`computeRoleFlags`) equal the legacy
 *          hand-coded `isAdmin/isEducator/isRecruiter/isLearner` logic.
 *   PC-5 — school-permission role_code resolved from the JWT for SSO permission
 *          roles equals the role string the old `users.role` path would have used.
 *
 * IMPORTANT: if a preservation test FAILS, do NOT silently adjust the golden
 * expectation — that means the migration changed a legitimate outcome and must
 * be investigated (intended de-shadowing change vs. a real regression).
 */

import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Real functions under test (test-only additive exports — see each module).
import { getRoleCategory } from '@/app/components/ProtectedRoute';
import { computeRoleFlags, pickPrimaryRole } from '@/shared/model/authStore';
import { ROLE_CATEGORIES, SSO_ROLES } from '@/shared/types/generated/roles';
// Functions-side modules (relative import; the Functions tree has no `@/*` alias).
import { ADMIN_ROLES, ROLE_CATEGORIES as FN_ROLE_CATEGORIES } from '../../../functions/lib/roleCategories';
import { pickPermissionRoleFromJwt } from '../../../functions/lib/schoolRole';

// src/__tests__/rbac/<thisFile> -> project root is three levels up.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

/** Order-independent set equality for string groups. */
function sameSet(a: readonly string[], b: readonly string[]): boolean {
    if (a.length !== b.length) return false;
    const sb = new Set(b);
    return a.every((x) => sb.has(x)) && new Set(a).size === a.length;
}

// ════════════════════════════════════════════════════════════════════════════
// PC-3: pickPrimaryRole — priority selection preserved
// ════════════════════════════════════════════════════════════════════════════

/**
 * GOLDEN priority list — the EXACT order the current `pickPrimaryRole` uses
 * (`src/shared/model/authStore.ts`). Encoded here as the "before" contract; any
 * reorder/insertion/removal in the implementation must fail this test.
 */
const GOLDEN_PRIMARY_ROLE_PRIORITY: readonly string[] = [
    'university_admin',
    'college_admin',
    'school_admin',
    'owner',
    'admin',
    'company_admin',
    'college_educator',
    'school_educator',
    'educator',
    'learner',
    'recruiter',
    'hr',
    'member',
];

/** Reference implementation of the legacy `pickPrimaryRole` (the golden oracle). */
function legacyPickPrimaryRole(roles: string[]): string | null {
    if (roles.length === 0) return null;
    for (const p of GOLDEN_PRIMARY_ROLE_PRIORITY) {
        if (roles.includes(p)) return p;
    }
    return roles[0];
}

describe('PC-3 · pickPrimaryRole priority selection is preserved (Property 10)', () => {
    // Representative golden cases from the task description.
    const cases: Array<[string[], string | null]> = [
        [['university_admin', 'school_admin'], 'university_admin'], // priority order
        [['learner'], 'learner'],
        [['recruiter', 'company_admin'], 'company_admin'], // company_admin precedes recruiter
        [['owner', 'admin'], 'owner'], // owner precedes admin
        [['college_admin', 'college_educator'], 'college_admin'],
        [['school_educator', 'educator'], 'school_educator'],
        [['hr', 'member'], 'hr'],
        [[], null], // empty → null
        [['totally_unknown'], 'totally_unknown'], // unknown-only → first element (fallback)
        [['zzz', 'aaa'], 'zzz'], // unknown-only multi → first element
    ];

    it.each(cases)('pickPrimaryRole(%j) === %j', (roles, expected) => {
        expect(pickPrimaryRole(roles)).toBe(expected);
    });

    /**
     * Property: for ANY set of roles (known + unknown, any order), the real
     * `pickPrimaryRole` equals the golden legacy oracle.
     * **Validates: Requirements 3.3**
     */
    it('property: pickPrimaryRole matches the golden legacy oracle for all inputs', () => {
        const roleArb = fc.oneof(
            fc.constantFrom(...SSO_ROLES, ...GOLDEN_PRIMARY_ROLE_PRIORITY),
            fc.string(), // unknown literals exercise the fallback branch
        );
        fc.assert(
            fc.property(fc.array(roleArb, { maxLength: 6 }), (roles) => {
                expect(pickPrimaryRole([...roles])).toBe(legacyPickPrimaryRole([...roles]));
            }),
            { numRuns: 100 },
        );
    });

    it('the implementation priority list still equals the golden list (locks order)', () => {
        // Derive the implementation's effective priority by probing single-role inputs:
        // for a single known role r, pickPrimaryRole([r]) === r, and for two roles the
        // earlier-in-priority one wins. We assert pairwise ordering matches the golden list.
        for (let i = 0; i < GOLDEN_PRIMARY_ROLE_PRIORITY.length; i++) {
            for (let j = i + 1; j < GOLDEN_PRIMARY_ROLE_PRIORITY.length; j++) {
                const hi = GOLDEN_PRIMARY_ROLE_PRIORITY[i];
                const lo = GOLDEN_PRIMARY_ROLE_PRIORITY[j];
                expect(pickPrimaryRole([lo, hi])).toBe(hi);
                expect(pickPrimaryRole([hi, lo])).toBe(hi);
            }
        }
    });
});

// ════════════════════════════════════════════════════════════════════════════
// PC-4: auth-store role helpers (computeRoleFlags) preserved
// ════════════════════════════════════════════════════════════════════════════

/**
 * GOLDEN legacy membership — the hand-coded boolean logic the helpers had BEFORE
 * they were derived from `ROLE_CATEGORIES` (task 13.3). Encoded explicitly so the
 * ROLE_CATEGORIES derivation is proven not to have changed who is what.
 */
const LEGACY_ADMIN_ROLES = ['admin', 'company_admin', 'owner', 'school_admin', 'college_admin', 'university_admin'];
const LEGACY_EDUCATOR_ROLES = ['educator', 'school_educator', 'college_educator'];
const LEGACY_RECRUITER_ROLES = ['recruiter', 'company_admin', 'hr'];
const LEGACY_LEARNER_ROLES = ['learner'];

/** Reference (golden) implementation of the legacy hand-coded role flags. */
function legacyComputeRoleFlags(roles: string[]) {
    return {
        isLearner: roles.some((r) => LEGACY_LEARNER_ROLES.includes(r)),
        isEducator: roles.some((r) => LEGACY_EDUCATOR_ROLES.includes(r)),
        isAdmin: roles.some((r) => LEGACY_ADMIN_ROLES.includes(r)),
        isRecruiter: roles.some((r) => LEGACY_RECRUITER_ROLES.includes(r)),
    };
}

describe('PC-4 · auth-store role helpers equal the legacy hand-coded logic (Property 10)', () => {
    it('isAdmin is true for exactly the legacy admin roles, false otherwise', () => {
        for (const r of SSO_ROLES) {
            expect(computeRoleFlags([r]).isAdmin).toBe(LEGACY_ADMIN_ROLES.includes(r));
        }
    });

    it('isEducator is true for exactly the legacy educator roles', () => {
        for (const r of SSO_ROLES) {
            expect(computeRoleFlags([r]).isEducator).toBe(LEGACY_EDUCATOR_ROLES.includes(r));
        }
    });

    it('isRecruiter is true for exactly the legacy recruiter roles', () => {
        for (const r of SSO_ROLES) {
            expect(computeRoleFlags([r]).isRecruiter).toBe(LEGACY_RECRUITER_ROLES.includes(r));
        }
    });

    it('isLearner is true for exactly the legacy learner role', () => {
        for (const r of SSO_ROLES) {
            expect(computeRoleFlags([r]).isLearner).toBe(LEGACY_LEARNER_ROLES.includes(r));
        }
    });

    it('multi-role set ["learner","school_admin"] is both learner and admin', () => {
        const flags = computeRoleFlags(['learner', 'school_admin']);
        expect(flags.isLearner).toBe(true);
        expect(flags.isAdmin).toBe(true);
        expect(flags.isEducator).toBe(false);
        expect(flags.isRecruiter).toBe(false);
    });

    it('company_admin is BOTH admin and recruiter (legacy overlap preserved)', () => {
        const flags = computeRoleFlags(['company_admin']);
        expect(flags.isAdmin).toBe(true);
        expect(flags.isRecruiter).toBe(true);
    });

    /**
     * Property: for ANY combination of roles, computeRoleFlags equals the golden
     * legacy hand-coded logic — the ROLE_CATEGORIES derivation changed nothing.
     * **Validates: Requirements 3.2, 3.4**
     */
    it('property: computeRoleFlags matches the legacy oracle for all role sets', () => {
        const roleArb = fc.oneof(fc.constantFrom(...SSO_ROLES), fc.string());
        fc.assert(
            fc.property(fc.array(roleArb, { maxLength: 6 }), (roles) => {
                expect(computeRoleFlags([...roles])).toEqual(legacyComputeRoleFlags([...roles]));
            }),
            { numRuns: 100 },
        );
    });
});

// ════════════════════════════════════════════════════════════════════════════
// PC-2: admin-authorization group preserved (functions/lib/roleCategories)
// ════════════════════════════════════════════════════════════════════════════

/**
 * GOLDEN historical admin literal — the inline admin role array that every
 * converted handler used pre-migration (bugfix §3.4: declared identically in
 * `educator/dashboard`, `learners/data`, and `ai-tutor/get-generation-usage`).
 * `requireAdmin` now sources its group from `ADMIN_ROLES`; this proves the
 * conversion added/removed NO role (order-independent equality).
 */
const HISTORICAL_INLINE_ADMIN_ROLES = [
    'admin',
    'company_admin',
    'owner',
    'college_admin',
    'university_admin',
    'school_admin',
];

describe('PC-2 · admin-authorization group equals the historical inline literal (Property 10)', () => {
    it('functions/lib ADMIN_ROLES (used by requireAdmin) equals the historical literal set', () => {
        expect(sameSet(ADMIN_ROLES, HISTORICAL_INLINE_ADMIN_ROLES)).toBe(true);
    });

    it('functions-side ROLE_CATEGORIES.admin equals the historical literal set', () => {
        expect(sameSet(FN_ROLE_CATEGORIES.admin, HISTORICAL_INLINE_ADMIN_ROLES)).toBe(true);
    });

    it('frontend ROLE_CATEGORIES.admin mirrors the functions-side admin group (no drift)', () => {
        expect(sameSet(ROLE_CATEGORIES.admin, FN_ROLE_CATEGORIES.admin)).toBe(true);
        expect(sameSet(ROLE_CATEGORIES.admin, HISTORICAL_INLINE_ADMIN_ROLES)).toBe(true);
    });

    /**
     * Property: a role authorizes as admin under the shared group iff it was in
     * the historical inline literal — admin allow/deny outcome is preserved.
     * **Validates: Requirements 3.1, 3.2**
     */
    it('property: admin membership matches the historical literal for every SSO role', () => {
        fc.assert(
            fc.property(fc.constantFrom(...SSO_ROLES), (role) => {
                const nowAdmin = (ADMIN_ROLES as readonly string[]).includes(role);
                const wasAdmin = HISTORICAL_INLINE_ADMIN_ROLES.includes(role);
                expect(nowAdmin).toBe(wasAdmin);
            }),
            { numRuns: 50 },
        );
    });
});

// ════════════════════════════════════════════════════════════════════════════
// PC-1: routing — ProtectedRoute.getRoleCategory mapping preserved
// ════════════════════════════════════════════════════════════════════════════

/**
 * GOLDEN routing map — the historical role→category mapping `ProtectedRoute`
 * has always used (note: school/college/university admins keep their OWN buckets
 * rather than collapsing into the broad `admin` category; this is intentional and
 * MUST be preserved per task 13.4).
 */
const GOLDEN_ROLE_CATEGORY_MAP: Record<string, string> = {
    learner: 'learner',
    school_educator: 'educator',
    college_educator: 'educator',
    school_admin: 'school_admin',
    college_admin: 'college_admin',
    university_admin: 'university_admin',
    recruiter: 'recruiter',
    admin: 'admin',
};

describe('PC-1 · ProtectedRoute.getRoleCategory routing map is preserved (Property 10)', () => {
    it.each(Object.entries(GOLDEN_ROLE_CATEGORY_MAP))('getRoleCategory(%j) === %j', (role, category) => {
        expect(getRoleCategory(role)).toBe(category);
    });

    it('unknown / unmapped roles pass through unchanged (e.g. owner, company_admin, hr)', () => {
        for (const role of ['owner', 'company_admin', 'hr', 'member', 'super_admin', 'totally_unknown']) {
            expect(getRoleCategory(role)).toBe(role);
        }
    });

    /**
     * Property: getRoleCategory equals the golden map for known roles and is the
     * identity for everything else — routing buckets are unchanged.
     * **Validates: Requirements 3.1**
     */
    it('property: getRoleCategory matches the golden map (identity fallback) for all inputs', () => {
        const arb = fc.oneof(fc.constantFrom(...SSO_ROLES), fc.string({ minLength: 1 }));
        fc.assert(
            fc.property(arb, (role) => {
                const expected = GOLDEN_ROLE_CATEGORY_MAP[role] ?? role;
                expect(getRoleCategory(role)).toBe(expected);
            }),
            { numRuns: 50 },
        );
    });
});

// ════════════════════════════════════════════════════════════════════════════
// PC-1 (route guards): the hardcoded route-guard role arrays are unchanged
// ════════════════════════════════════════════════════════════════════════════

/**
 * The route-guard role arrays were NOT touched by P2. A light golden assertion
 * (structural read of the route files) guards against accidental drift in which
 * roles can reach each route tree.
 */
const ROUTE_ROLE_GOLDENS: Array<{ file: string; constName: string; golden: string[] }> = [
    { file: 'src/app/routes/learnerRoutes.jsx', constName: 'LEARNER_ROLES', golden: ['learner'] },
    {
        file: 'src/app/routes/educatorRoutes.jsx',
        constName: 'EDUCATOR_ROLES',
        golden: ['educator', 'school_educator', 'college_educator'],
    },
    {
        file: 'src/app/routes/recruiterRoutes.jsx',
        constName: 'RECRUITER_ROLES',
        golden: ['recruiter', 'company_admin'],
    },
    { file: 'src/app/routes/adminRoutes.jsx', constName: 'COLLEGE_ADMIN_ROLES', golden: ['college_admin'] },
    { file: 'src/app/routes/adminRoutes.jsx', constName: 'SCHOOL_ADMIN_ROLES', golden: ['school_admin'] },
    { file: 'src/app/routes/adminRoutes.jsx', constName: 'UNIVERSITY_ADMIN_ROLES', golden: ['university_admin'] },
];

/** Parse a `const NAME = ["a", "b"];` literal string-array declaration from source. */
function parseRoleArray(src: string, constName: string): string[] | null {
    const re = new RegExp(`const\\s+${constName}\\s*=\\s*\\[([^\\]]*)\\]`);
    const m = src.match(re);
    if (!m) return null;
    return m[1]
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter((s) => s.length > 0);
}

describe('PC-1 · route-guard role arrays are unchanged (golden)', () => {
    it.each(ROUTE_ROLE_GOLDENS)('$constName in $file equals its golden set', ({ file, constName, golden }) => {
        const abs = path.join(PROJECT_ROOT, file);
        expect(fs.existsSync(abs), `route file missing: ${file}`).toBe(true);
        const parsed = parseRoleArray(fs.readFileSync(abs, 'utf8'), constName);
        expect(parsed, `could not find ${constName} in ${file}`).not.toBeNull();
        expect(sameSet(parsed!, golden), `${constName} drifted: got ${JSON.stringify(parsed)}`).toBe(true);
    });
});

// ════════════════════════════════════════════════════════════════════════════
// PC-5: school-permission role_code from JWT equals the old users.role path
// ════════════════════════════════════════════════════════════════════════════

/**
 * For the four SSO roles that double as permission `role_code`s, the JWT-direct
 * resolution (`pickPermissionRoleFromJwt`) must yield the SAME role string the
 * old `users.role` column path would have used — reinforcing the task-12.2
 * behavior-preservation claim WITHOUT duplicating the schoolRole unit tests
 * (task 19.2), which cover the DB-backed branch.
 */
describe('PC-5 · JWT permission role_code preserves the old users.role string (Property 10)', () => {
    const ssoPermissionRoles: Array<[string, string]> = [
        ['school_admin', 'school_admin'],
        ['college_admin', 'college_admin'],
        ['college_educator', 'college_educator'],
        ['school_educator', 'school_educator'],
    ];

    it.each(ssoPermissionRoles)('JWT role [%s] resolves to role_code %s (same as users.role)', (role, expected) => {
        expect(pickPermissionRoleFromJwt([role])).toBe(expected);
    });

    it('a non-permission SSO role (learner) yields null (no permission row, as before)', () => {
        expect(pickPermissionRoleFromJwt(['learner'])).toBeNull();
    });
});
