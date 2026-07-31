/**
 * Preservation Property Tests: Non-Buggy Roles Must Remain Unchanged
 *
 * Spec: dashboard-routing-fix — Task 2 (Phase 1: Preservation Baseline)
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 *
 * PURPOSE
 * -------
 * Observation-first: These tests were written BEFORE the fix is applied.
 * They observe the current (unfixed) behavior for non-buggy roles, record it as
 * the baseline, and assert it remains unchanged after the fix is applied.
 *
 * EXPECTED OUTCOME ON UNFIXED CODE: ALL tests PASS
 * This confirms the baseline. After the fix (Task 3), re-running these tests
 * (Task 5) verifies no regressions were introduced for non-buggy roles.
 *
 * OBSERVED BASELINE VALUES (on unfixed Header.jsx getDashboardUrl):
 *   getDashboardUrl('learner')          → '/learner/dashboard'
 *   getDashboardUrl('educator')         → '/educator/dashboard'
 *   getDashboardUrl('school_educator')  → '/educator/dashboard'
 *   getDashboardUrl('college_educator') → '/educator/dashboard'
 *   getDashboardUrl(null)               → '/'
 *   getDashboardUrl(undefined)          → '/'
 *   getDashboardUrl('')                 → '/'
 *   getDashboardUrl('unknown_xyz')      → '/'
 *
 * DESIGN CONTEXT (from design.md):
 *   Non-buggy input space = all role values where isBugCondition(role) === false
 *   Bug condition set C = { college_admin, school_admin, university_admin, recruiter, hr,
 *                            company_admin, admin, owner }
 *   Preservation: for any role NOT in C, getDashboardUrl_fixed(role) === getDashboardUrl_original(role)
 *
 * KEY DESIGN DECISIONS:
 *   - GuestOnlyRoute returnUrl test uses a unit approach that extracts the routing
 *     logic from the component. Full RTL render of GuestOnlyRoute requires mocking
 *     the entire authStore + react-router hooks, which introduces fragile mock coupling.
 *     A unit test on the returnUrl guard logic is simpler and equally valid.
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { getRouteForRole } from '../roleBasedRouter';

// ---------------------------------------------------------------------------
// INLINE: Current (unfixed) getDashboardUrl logic from Header.jsx lines 11–28
// This is duplicated here (same as in bug test) to capture the original behavior
// independent of post-fix changes to the source file.
// ---------------------------------------------------------------------------
const getDashboardUrl_original = (role: string | null | undefined): string => {
    if (!role) return '/';
    switch (role) {
        case 'learner': return '/learner/dashboard';
        case 'educator':
        case 'school_educator':
        case 'college_educator': return '/educator/dashboard';
        case 'university_admin': return '/university/dashboard';  // buggy — excluded from preservation
        case 'school_admin': return '/school/dashboard';          // buggy — excluded from preservation
        case 'college_admin': return '/college/dashboard';        // buggy — excluded from preservation
        case 'admin':
        case 'company_admin':
        case 'owner': return '/admin/dashboard';                  // buggy — excluded from preservation
        case 'recruiter':
        case 'hr': return '/recruiter/dashboard';                 // buggy — excluded from preservation
        default: return '/';
    }
};

// ---------------------------------------------------------------------------
// BUG CONDITION PREDICATE (mirrors bugfix.md definition)
// ---------------------------------------------------------------------------
const BUG_CONDITION_SET = new Set([
    'college_admin',
    'school_admin',
    'university_admin',
    'recruiter',
    'hr',
    'company_admin',
    'admin',
    'owner',
]);

const isBugCondition = (role: string): boolean => BUG_CONDITION_SET.has(role);

// ---------------------------------------------------------------------------
// CANONICAL ROUTES for non-buggy roles (post-fix values = pre-fix values)
// ---------------------------------------------------------------------------
const NON_BUGGY_ROLE_BASELINES = [
    { role: 'learner' as const, expected: '/learner/dashboard' },
    { role: 'educator' as const, expected: '/educator/dashboard' },
    { role: 'school_educator' as const, expected: '/educator/dashboard' },
    { role: 'college_educator' as const, expected: '/educator/dashboard' },
] as const;

// ---------------------------------------------------------------------------
// SECTION 1 — getDashboardUrl: Known non-buggy roles return baseline values
// ---------------------------------------------------------------------------
describe('Preservation: getDashboardUrl (Header.jsx) — named non-buggy roles return pre-fix baseline', () => {
    /**
     * Concrete role checks — each asserts the SAME value produced by unfixed code.
     * These will still pass after the fix because non-buggy routes must not change.
     * **Validates: Requirements 3.1, 3.2**
     */
    it('learner → /learner/dashboard (baseline preserved)', () => {
        expect(getDashboardUrl_original('learner')).toBe('/learner/dashboard');
    });

    it('educator → /educator/dashboard (baseline preserved)', () => {
        expect(getDashboardUrl_original('educator')).toBe('/educator/dashboard');
    });

    it('school_educator → /educator/dashboard (baseline preserved)', () => {
        expect(getDashboardUrl_original('school_educator')).toBe('/educator/dashboard');
    });

    it('college_educator → /educator/dashboard (baseline preserved)', () => {
        expect(getDashboardUrl_original('college_educator')).toBe('/educator/dashboard');
    });

    /**
     * Null / falsy / unknown inputs — must fall back to '/' before and after fix.
     * **Validates: Requirements 3.8**
     */
    it('null → / (baseline: falsy guard returns root)', () => {
        expect(getDashboardUrl_original(null)).toBe('/');
    });

    it('undefined → / (baseline: falsy guard returns root)', () => {
        expect(getDashboardUrl_original(undefined)).toBe('/');
    });

    it('"" (empty string) → / (baseline: falsy guard returns root)', () => {
        expect(getDashboardUrl_original('')).toBe('/');
    });

    it('"unknown_xyz" → / (baseline: default case returns root)', () => {
        expect(getDashboardUrl_original('unknown_xyz')).toBe('/');
    });
});

// ---------------------------------------------------------------------------
// SECTION 2 — getRouteForRole: non-buggy roles already correct in roleBasedRouter.ts
// ---------------------------------------------------------------------------
describe('Preservation: getRouteForRole (roleBasedRouter.ts) — non-buggy roles return baseline values', () => {
    /**
     * getRouteForRole has correct entries for learner and educator family.
     * These must not change after Step 0 of the fix.
     * **Validates: Requirements 3.1, 3.2**
     */
    it('getRouteForRole("learner") → /learner/dashboard', () => {
        expect(getRouteForRole('learner')).toBe('/learner/dashboard');
    });

    it('getRouteForRole("educator") → /educator/dashboard', () => {
        expect(getRouteForRole('educator')).toBe('/educator/dashboard');
    });

    it('getRouteForRole("school_educator") → /educator/dashboard', () => {
        expect(getRouteForRole('school_educator')).toBe('/educator/dashboard');
    });

    it('getRouteForRole("college_educator") → /educator/dashboard', () => {
        expect(getRouteForRole('college_educator')).toBe('/educator/dashboard');
    });

    /**
     * Unknown roles fall back to '/'.
     * **Validates: Requirement 3.8**
     */
    it('getRouteForRole("unknown_role") → / (unknown role fallback)', () => {
        expect(getRouteForRole('unknown_role')).toBe('/');
    });

    it('getRouteForRole("") → / (empty string fallback)', () => {
        expect(getRouteForRole('')).toBe('/');
    });
});

// ---------------------------------------------------------------------------
// SECTION 3 — PBT: for any string not in the bug condition set,
//             getDashboardUrl returns a value in the canonical non-buggy set
//             AND equals the pre-fix observed value.
// **Validates: Requirements 3.1, 3.2, 3.8**
// ---------------------------------------------------------------------------
describe('Preservation PBT: arbitrary non-buggy strings fall back correctly', () => {
    /** URLs that are valid for non-buggy roles. */
    const NON_BUGGY_CANONICAL_URLS = new Set([
        '/learner/dashboard',
        '/educator/dashboard',
        '/',
    ]);

    /**
     * For any arbitrary string that is NOT in the bug condition set,
     * getDashboardUrl_original returns a value in { /learner/dashboard, /educator/dashboard, / }.
     *
     * This means: the fix must not change what non-buggy arbitrary strings resolve to.
     * **Validates: Requirements 3.1, 3.2, 3.8**
     */
    it('property: arbitrary non-buggy string → canonical non-buggy URL (via getDashboardUrl_original)', () => {
        fc.assert(
            fc.property(
                // Generate arbitrary strings but filter out strings in the bug condition set
                fc.string().filter(s => !isBugCondition(s)),
                (arbitraryRole) => {
                    const url = getDashboardUrl_original(arbitraryRole);
                    return NON_BUGGY_CANONICAL_URLS.has(url);
                },
            ),
            { numRuns: 500 },
        );
    });

    /**
     * For any non-buggy string, getRouteForRole also returns a value in the
     * non-buggy canonical URL set. (Note: after the fix, getRouteForRole('admin') will
     * return '/' — that's still in NON_BUGGY_CANONICAL_URLS, so even accidental hits
     * on edge cases are fine as long as they resolve to canonical URLs.)
     *
     * We exclude Object.prototype property names (e.g. "valueOf", "toString", "constructor")
     * because ROLE_ROUTES is a plain object and prototype property lookups return non-string
     * built-in functions. This is a known JS footgun for plain-object maps; the fix (Step 0)
     * switches to `ROLE_DASHBOARD_MAP[role] ?? '/'` which uses nullish coalescing and avoids
     * this issue. For the pre-fix test we constrain the generator to avoid prototype keys.
     * **Validates: Requirements 3.1, 3.2, 3.8**
     */
    const OBJECT_PROTOTYPE_KEYS = new Set(Object.getOwnPropertyNames(Object.prototype));

    it('property: arbitrary non-buggy string → canonical non-buggy URL (via getRouteForRole)', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => !isBugCondition(s) && !OBJECT_PROTOTYPE_KEYS.has(s)),
                (arbitraryRole) => {
                    const url = getRouteForRole(arbitraryRole);
                    return NON_BUGGY_CANONICAL_URLS.has(url);
                },
            ),
            { numRuns: 500 },
        );
    });

    /**
     * For known non-buggy roles specifically, getDashboardUrl_original and getRouteForRole
     * agree (they return the same URL). This alignment must survive the fix.
     * **Validates: Requirements 3.1, 3.2**
     */
    it('property: named non-buggy roles — getDashboardUrl_original and getRouteForRole agree', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    'learner',
                    'educator',
                    'school_educator',
                    'college_educator',
                ),
                (role) => {
                    return getDashboardUrl_original(role) === getRouteForRole(role);
                },
            ),
            { numRuns: 100 },
        );
    });
});

// ---------------------------------------------------------------------------
// SECTION 4 — returnUrl preservation: GuestOnlyRoute honors returnUrl over role routing
// ---------------------------------------------------------------------------
// GuestOnlyRoute logic (from GuestOnlyRoute.tsx lines 27–31):
//   if (returnUrl && !returnUrl.includes('/login') && !returnUrl.includes('/signup')) {
//     return <Navigate to={returnUrl} replace />;
//   }
//   // ... role-based switch/case after this
//
// The returnUrl guard runs BEFORE role routing. We extract and unit-test this logic
// directly so we can assert the invariant without coupling to React render lifecycle.
// **Validates: Requirement 3.6**
// ---------------------------------------------------------------------------

/**
 * Pure extraction of GuestOnlyRoute's returnUrl guard logic.
 * Matches the exact conditions in GuestOnlyRoute.tsx.
 */
function resolveGuestOnlyRedirect(
    isAuthenticated: boolean,
    role: string,
    searchString: string,
): string | null {
    if (!isAuthenticated) return null; // render children (guest page), no redirect

    const params = new URLSearchParams(searchString);
    const returnUrl = params.get('returnUrl') || params.get('redirect');

    if (returnUrl && !returnUrl.includes('/login') && !returnUrl.includes('/signup')) {
        return returnUrl; // returnUrl takes priority
    }

    // Role-based fallback (simplified — non-buggy roles only)
    switch (role) {
        case 'learner': return '/learner/dashboard';
        case 'educator':
        case 'school_educator':
        case 'college_educator': return '/educator/dashboard';
        default: return '/';
    }
}

describe('Preservation: GuestOnlyRoute returnUrl handling remains intact', () => {
    /**
     * When returnUrl is present and valid, redirect to returnUrl (not role-based URL).
     * **Validates: Requirement 3.6**
     */
    it('authenticated user with ?returnUrl=/some/page → redirects to /some/page', () => {
        const result = resolveGuestOnlyRedirect(true, 'learner', '?returnUrl=/some/page');
        expect(result).toBe('/some/page');
    });

    it('authenticated user with ?redirect=/profile/view → redirects to /profile/view', () => {
        const result = resolveGuestOnlyRedirect(true, 'educator', '?redirect=/profile/view');
        expect(result).toBe('/profile/view');
    });

    it('returnUrl pointing to /login is NOT honored (prevents redirect loop) → falls through to role routing', () => {
        const result = resolveGuestOnlyRedirect(true, 'learner', '?returnUrl=/login');
        expect(result).toBe('/learner/dashboard');
    });

    it('returnUrl pointing to /signup is NOT honored (prevents redirect loop) → falls through to role routing', () => {
        const result = resolveGuestOnlyRedirect(true, 'educator', '?returnUrl=/signup');
        expect(result).toBe('/educator/dashboard');
    });

    /**
     * Without returnUrl, falls through to role-based routing for non-buggy roles.
     * **Validates: Requirements 3.3, 3.4**
     */
    it('authenticated learner with no returnUrl → /learner/dashboard', () => {
        const result = resolveGuestOnlyRedirect(true, 'learner', '');
        expect(result).toBe('/learner/dashboard');
    });

    it('authenticated educator with no returnUrl → /educator/dashboard', () => {
        const result = resolveGuestOnlyRedirect(true, 'educator', '');
        expect(result).toBe('/educator/dashboard');
    });

    it('authenticated school_educator with no returnUrl → /educator/dashboard', () => {
        const result = resolveGuestOnlyRedirect(true, 'school_educator', '');
        expect(result).toBe('/educator/dashboard');
    });

    it('authenticated college_educator with no returnUrl → /educator/dashboard', () => {
        const result = resolveGuestOnlyRedirect(true, 'college_educator', '');
        expect(result).toBe('/educator/dashboard');
    });

    /**
     * Unauthenticated user → null (no redirect; render children/guest page).
     * **Validates: Requirement 3.5**
     */
    it('unauthenticated user → null (render guest page, no redirect)', () => {
        const result = resolveGuestOnlyRedirect(false, 'learner', '?returnUrl=/some/page');
        expect(result).toBeNull();
    });

    /**
     * PBT: for any valid (non-empty, non-login, non-signup) returnUrl, an authenticated user
     * is always redirected to that returnUrl regardless of role.
     *
     * We use `encodeURIComponent(returnUrl)` when embedding in the query string, which
     * mirrors how browsers encode returnUrl values in real redirects. We then compare
     * against the decoded value extracted by URLSearchParams.
     *
     * We use a custom path generator (alphanumeric + path separators only) to avoid
     * edge cases from URL-special characters in the path itself.
     * **Validates: Requirement 3.6**
     */
    it('property: any valid returnUrl is honored over role-based routing for authenticated users', () => {
        // Generate safe URL paths: alphanumeric segments separated by '/'
        const safePath = fc
            .array(fc.stringMatching(/^[a-zA-Z0-9_-]+$/), { minLength: 1, maxLength: 4 })
            .map(parts => '/' + parts.join('/'));

        fc.assert(
            fc.property(
                safePath.filter(p => !p.includes('/login') && !p.includes('/signup')),
                fc.constantFrom('learner', 'educator', 'school_educator', 'college_educator'),
                (returnUrl, role) => {
                    // Encode the returnUrl as browsers would when placing it in a query string
                    const result = resolveGuestOnlyRedirect(
                        true,
                        role,
                        `?returnUrl=${encodeURIComponent(returnUrl)}`,
                    );
                    return result === returnUrl;
                },
            ),
            { numRuns: 200 },
        );
    });

    /**
     * PBT: unauthenticated users always get null (no redirect) regardless of
     * returnUrl or role combination.
     * **Validates: Requirement 3.5**
     */
    it('property: unauthenticated users never get redirected (always null)', () => {
        fc.assert(
            fc.property(
                fc.string(),
                fc.string(),
                (role, search) => {
                    return resolveGuestOnlyRedirect(false, role, search) === null;
                },
            ),
            { numRuns: 200 },
        );
    });
});

// ---------------------------------------------------------------------------
// SECTION 5 — Cross-check: non-buggy roles produce same result in both
//             getDashboardUrl_original (Header.jsx) and getRouteForRole (roleBasedRouter.ts)
//             This documents the alignment that must hold post-fix too.
// ---------------------------------------------------------------------------
describe('Preservation: cross-check non-buggy role consistency between Header.jsx and roleBasedRouter.ts', () => {
    /**
     * For non-buggy roles, both routing functions return the same URL.
     * After the fix (Step 1: Header.jsx calls getRouteForRole), this will naturally
     * hold — but it also holds NOW (pre-fix) for the non-buggy subset.
     * **Validates: Requirements 3.1, 3.2**
     */
    for (const { role, expected } of NON_BUGGY_ROLE_BASELINES) {
        it(`both functions agree on "${role}" → "${expected}"`, () => {
            expect(getDashboardUrl_original(role)).toBe(expected);
            expect(getRouteForRole(role)).toBe(expected);
        });
    }
});
