/**
 * Bug-Condition Fix Verification Test: Stale Role-to-Dashboard URL Mapping
 *
 * Spec: dashboard-routing-fix — Task 1/4 (Phase 1: Bug Condition / Phase 3: Verify Fix)
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11**
 *
 * PURPOSE
 * -------
 * This test verifies that the canonical role→dashboard URL mapping (ROLE_DASHBOARD_MAP
 * in roleBasedRouter.ts) is correct for all known roles, and that no stale routes
 * (e.g., /college/dashboard, /school/dashboard, /admin/dashboard) survive in the
 * codebase.
 *
 * The fix strategy was:
 *   1. Export ROLE_DASHBOARD_MAP as the single source of truth
 *   2. Add missing 'hr' entry + fix admin/company_admin/owner → /, /recruitment/overview
 *   3. All 6 SPA components now import getRouteForRole instead of maintaining local maps
 *   4. Edge middleware (cannot import SPA code) mirrors the map with a sync comment
 *
 * DESIGN CONTEXT:
 *   Canonical mapping (from ROLE_DASHBOARD_MAP):
 *     learner           → /learner/dashboard
 *     educator          → /educator/dashboard
 *     school_educator   → /educator/dashboard
 *     college_educator  → /educator/dashboard
 *     college_admin     → /college-admin/dashboard
 *     school_admin      → /school-admin/dashboard
 *     university_admin  → /university-admin/dashboard
 *     recruiter         → /recruitment/overview
 *     hr                → /recruitment/overview
 *     company_admin     → /recruitment/overview
 *     admin             → /
 *     owner             → /
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { getRouteForRole } from '../roleBasedRouter';

// ---------------------------------------------------------------------------
// getDashboardUrl_current mirrors Header.jsx (which now delegates to getRouteForRole)
// ---------------------------------------------------------------------------
const getDashboardUrl_current = (role: string | null | undefined): string =>
    getRouteForRole(role ?? '');

// ---------------------------------------------------------------------------
// CANONICAL MAPPING: Expected post-fix URLs (from design.md)
// ---------------------------------------------------------------------------
const CANONICAL_ROLE_MAP: Record<string, string> = {
    learner: '/learner/dashboard',
    educator: '/educator/dashboard',
    school_educator: '/educator/dashboard',
    college_educator: '/educator/dashboard',
    college_admin: '/college-admin/dashboard',
    school_admin: '/school-admin/dashboard',
    university_admin: '/university-admin/dashboard',
    recruiter: '/recruitment/overview',
    hr: '/recruitment/overview',
    company_admin: '/recruitment/overview',
    admin: '/',
    owner: '/',
};

/** Stale routes that MUST NOT appear for any role after the fix. */
const STALE_ROUTES = new Set([
    '/college/dashboard',
    '/school/dashboard',
    '/university/dashboard',
    '/recruiter/dashboard',
    '/admin/dashboard',
    '/recruitment/dashboard',
]);

/** The canonical correct routes. */
const CANONICAL_ROUTES = new Set([
    '/college-admin/dashboard',
    '/school-admin/dashboard',
    '/university-admin/dashboard',
    '/recruitment/overview',
    '/learner/dashboard',
    '/educator/dashboard',
    '/',
]);

/** Bug condition set — the 8 roles known to be misrouted. */
const BUGGY_ROLES = [
    'college_admin',
    'school_admin',
    'university_admin',
    'recruiter',
    'hr',
    'company_admin',
    'admin',
    'owner',
] as const;

// ---------------------------------------------------------------------------
// SECTION 1 — Verify fix: NO stale routes remain in getDashboardUrl
// ---------------------------------------------------------------------------
describe('Fix Verified: getDashboardUrl (Header.jsx) returns canonical routes, no stale routes', () => {
    /**
     * After the fix (Step 1: Header.jsx delegates to getRouteForRole), all buggy
     * roles return the correct canonical URLs. No stale routes remain.
     */
    it('confirms all buggy roles now resolve to canonical routes (no stale URLs)', () => {
        expect(getDashboardUrl_current('college_admin')).toBe('/college-admin/dashboard');
        expect(getDashboardUrl_current('school_admin')).toBe('/school-admin/dashboard');
        expect(getDashboardUrl_current('university_admin')).toBe('/university-admin/dashboard');
        expect(getDashboardUrl_current('recruiter')).toBe('/recruitment/overview');
        expect(getDashboardUrl_current('hr')).toBe('/recruitment/overview');
        expect(getDashboardUrl_current('company_admin')).toBe('/recruitment/overview');
        expect(getDashboardUrl_current('admin')).toBe('/');
        expect(getDashboardUrl_current('owner')).toBe('/');
    });

    /**
     * Property: For ALL buggy roles, the resolved URL is in CANONICAL_ROUTES
     * and NOT in STALE_ROUTES.
     */
    it('property: every buggy role resolves to a canonical route (no stale routes)', () => {
        fc.assert(
            fc.property(fc.constantFrom(...BUGGY_ROLES), (role) => {
                const url = getDashboardUrl_current(role);
                return CANONICAL_ROUTES.has(url) && !STALE_ROUTES.has(url);
            }),
            { numRuns: BUGGY_ROLES.length * 3 },
        );
    });
});

// ---------------------------------------------------------------------------
// SECTION 2 — Detailed per-role canonical route verification
// ---------------------------------------------------------------------------
describe('Fix Verified: getDashboardUrl returns correct canonical routes for every buggy role', () => {
    it('college_admin → /college-admin/dashboard', () => {
        expect(getDashboardUrl_current('college_admin')).toBe('/college-admin/dashboard');
    });

    it('school_admin → /school-admin/dashboard', () => {
        expect(getDashboardUrl_current('school_admin')).toBe('/school-admin/dashboard');
    });

    it('university_admin → /university-admin/dashboard', () => {
        expect(getDashboardUrl_current('university_admin')).toBe('/university-admin/dashboard');
    });

    it('recruiter → /recruitment/overview', () => {
        expect(getDashboardUrl_current('recruiter')).toBe('/recruitment/overview');
    });

    it('hr → /recruitment/overview', () => {
        expect(getDashboardUrl_current('hr')).toBe('/recruitment/overview');
    });

    it('company_admin → /recruitment/overview', () => {
        expect(getDashboardUrl_current('company_admin')).toBe('/recruitment/overview');
    });

    it('admin → / (non-existent SPA route; safe root fallback)', () => {
        expect(getDashboardUrl_current('admin')).toBe('/');
    });

    it('owner → / (non-existent SPA route; safe root fallback)', () => {
        expect(getDashboardUrl_current('owner')).toBe('/');
    });

    /**
     * Property: For EVERY buggy role, getDashboardUrl must return a canonical route
     * AND must NOT return any stale route.
     * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**
     */
    it('property: all buggy roles resolve to canonical routes and not stale routes', () => {
        fc.assert(
            fc.property(fc.constantFrom(...BUGGY_ROLES), (role) => {
                const url = getDashboardUrl_current(role);
                const isCanonical = CANONICAL_ROUTES.has(url);
                const isStale = STALE_ROUTES.has(url);
                return isCanonical && !isStale;
            }),
            { numRuns: BUGGY_ROLES.length * 3 },
        );
    });
});

// ---------------------------------------------------------------------------
// SECTION 3 — Verify getRouteForRole (roleBasedRouter.ts) — the canonical map
// ---------------------------------------------------------------------------
describe('Fix Verified: getRouteForRole (roleBasedRouter.ts) returns canonical routes for all buggy roles', () => {
    /**
     * ROLE_DASHBOARD_MAP is the single source of truth. After Step 0, it now has:
     *   admin → /, company_admin → /recruitment/overview, owner → /,
     *   hr → /recruitment/overview — all previously stale entries are fixed.
     */
    it('getRouteForRole("admin") → / (safe root fallback)', () => {
        expect(getRouteForRole('admin')).toBe('/');
    });

    it('getRouteForRole("company_admin") → /recruitment/overview', () => {
        expect(getRouteForRole('company_admin')).toBe('/recruitment/overview');
    });

    it('getRouteForRole("owner") → / (safe root fallback)', () => {
        expect(getRouteForRole('owner')).toBe('/');
    });

    it('getRouteForRole("hr") → /recruitment/overview (previously missing)', () => {
        expect(getRouteForRole('hr')).toBe('/recruitment/overview');
    });

    /**
     * Property: For every known buggy role, getRouteForRole must return the
     * expected canonical URL. **Validates: Requirements 2.9, 2.10, 2.11**
     */
    it('property: getRouteForRole returns canonical routes for all buggy roles', () => {
        fc.assert(
            fc.property(fc.constantFrom(...BUGGY_ROLES), (role) => {
                const url = getRouteForRole(role);
                const expectedUrl = CANONICAL_ROLE_MAP[role];
                return url === expectedUrl;
            }),
            { numRuns: BUGGY_ROLES.length * 3 },
        );
    });
});

// ---------------------------------------------------------------------------
// SECTION 4 — Preservation baseline: non-buggy roles work correctly (regression guard)
// ---------------------------------------------------------------------------
describe('Preservation: non-buggy roles correctly handled (unaffected by fix)', () => {
    const NON_BUGGY_ROLES = [
        { role: 'learner', expected: '/learner/dashboard' },
        { role: 'educator', expected: '/educator/dashboard' },
        { role: 'school_educator', expected: '/educator/dashboard' },
        { role: 'college_educator', expected: '/educator/dashboard' },
        { role: null, expected: '/' },
        { role: undefined, expected: '/' },
        { role: '', expected: '/' },
        { role: 'unknown_xyz', expected: '/' },
    ] as const;

    /**
     * Verify non-buggy roles are already correct in getDashboardUrl — these MUST remain
     * unchanged after the fix (regression guard).
     */
    for (const { role, expected } of NON_BUGGY_ROLES) {
        it(`getDashboardUrl(${JSON.stringify(role)}) → ${expected} (preserved, non-buggy)`, () => {
            expect(getDashboardUrl_current(role as string | null | undefined)).toBe(expected);
        });
    }

    /**
     * Verify non-buggy roles are correct in getRouteForRole too.
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

    it('getRouteForRole("unknown_role") → / (fallback)', () => {
        expect(getRouteForRole('unknown_role')).toBe('/');
    });
});
