/**
 * P2 GATE — Per-endpoint server-side enforcement (deny/allow) tests.
 * Spec: rbac-architecture-violations-fix — task 14.1.
 * Validates: Requirements 7.1, 7.3 (single enforcement boundary; authorization
 * decided server-side from the JWT, never the client). Design §"Enforcement
 * tests (P2, P5)": "Each protected endpoint: authorized role → 200; unauthorized
 * → 403 (server-side, not client)."
 *
 * ── Approach (Strategy A: guard-layer composition) ─────────────────────────
 * The converted handlers are `withAuth(requireAdmin(inner))` /
 * `withAuth(requireRole([...], inner))`. `withAuth` itself verifies a real SSO
 * JWT via the `SSO_SERVICE` Service Binding (JWKS fetch + crypto), which is NOT
 * available in a unit test without a live binding — and that JWT-verification
 * layer is already covered by auth-core's own test suite (task 9.2). What this
 * P2 GATE must prove is the AUTHORIZATION decision: that the guard the handler
 * composes lets an authorized role through and denies an unauthorized role
 * server-side (403), BEFORE the wrapped handler runs.
 *
 * So we exercise the guard composition DETERMINISTICALLY: invoke the exported
 * guard (`requireAdmin` from `functions/lib/auth.ts`, and the re-exported
 * generic `requireRole`) with a mock `ContextWithUser` whose `data.user.roles`
 * is set to a given role set — exactly the shape `withAuth` populates after a
 * successful JWT verify (`context.data.user = verifyJWT(token)`), see
 * auth-core `withAuth.ts`. We assert:
 *   - authorized role  → the wrapped handler IS invoked and its 200 is returned;
 *   - unauthorized role → 403 `{error:"Forbidden: insufficient role"}` from the
 *     SERVER guard (auth-core `jsonError`), and the wrapped handler is NOT
 *     invoked (no client check involved).
 *
 * This is the SAME guard instance the real endpoints compose, so the decision
 * proven here is the decision those endpoints enforce. Endpoints whose admin
 * check is an in-handler ownership/scope bypass (not a blanket gate) depend on
 * the shared `ADMIN_ROLES` group — its correctness is asserted directly so the
 * group backing every such endpoint is validated too.
 */

import type { ContextWithUser } from '@rareminds-eym/auth-core';
import { describe, expect, it } from 'vitest';
import { requireAdmin, requireRole } from '../../lib/auth';
import { ADMIN_ROLES, ROLE_CATEGORIES } from '../../lib/roleCategories';

// ── Test fixtures ──────────────────────────────────────────────────────────

const ADMIN_GROUP = [...ROLE_CATEGORIES.admin]; // admin, company_admin, owner, school_admin, college_admin, university_admin

// Roles that are NOT in the admin group (incl. the `system` category, which is
// deliberately separate from `admin`). requireAdmin must DENY every one.
const NON_ADMIN_ROLES = [
    'learner',
    'educator',
    'school_educator',
    'college_educator',
    'recruiter',
    'hr',
    'viewer',
    'super_admin', // system category — NOT admin
    'rm_admin',    // system category — NOT admin
    'rm_manager',  // system category — NOT admin
];

/**
 * Build a mock `ContextWithUser` in the exact shape auth-core's `withAuth`
 * produces after a successful JWT verify (`context.data.user = <AuthUser>`).
 * Only `data.user.roles` matters to the role guards; the rest satisfies types.
 */
function makeCtx(roles: string[] | undefined): ContextWithUser {
    return {
        request: new Request('https://example.test/api/protected', { method: 'POST' }),
        env: {},
        params: {},
        data: {
            user: roles === undefined
                ? undefined
                : {
                    sub: 'user-1',
                    email: 'u@example.test',
                    org_id: 'org-1',
                    roles,
                    products: [],
                    membership_status: 'active',
                    is_email_verified: true,
                },
        },
        waitUntil: () => { },
        passThroughOnException: () => { },
    } as unknown as ContextWithUser;
}

/**
 * A spy "inner handler" representing a protected endpoint's body. Records
 * whether it was invoked and returns a recognizable 200 (mirroring the
 * `apiSuccess(...)` 200 the real handlers return on the allow path).
 */
function makeSpyHandler() {
    const state = { invoked: false };
    const handler = async (_ctx: ContextWithUser): Promise<Response> => {
        state.invoked = true;
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    };
    return { handler, state };
}

/** Assert a Response is the auth-core server-side 403 deny (NOT a client check). */
async function expectServerDeny403(res: Response) {
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: string };
    // auth-core requireRole → jsonError("Forbidden: insufficient role", 403)
    expect(body.error).toBe('Forbidden: insufficient role');
}

// ── requireAdmin guard ───────────────────────────────────────────────────────
// THE gate composed by the converted admin handlers:
//   - functions/api/settings/[[path]].ts        → withAuth(requireAdmin(...))
//   - functions/api/learners/actions.ts         → withAuth(requireAdmin(...))
describe('Enforcement: requireAdmin guard (settings/[[path]], learners/actions)', () => {
    describe('ALLOW — authorized admin roles reach the handler (200)', () => {
        it.each(ADMIN_GROUP)('role "%s" → 200 and handler invoked', async (role) => {
            const { handler, state } = makeSpyHandler();
            const guarded = requireAdmin(handler);

            const res = await guarded(makeCtx([role]));

            expect(res.status).toBe(200);
            expect(state.invoked).toBe(true);
            expect(await res.json()).toEqual({ ok: true });
        });

        it('allows a user holding an admin role alongside non-admin roles', async () => {
            const { handler, state } = makeSpyHandler();
            const res = await requireAdmin(handler)(makeCtx(['learner', 'school_admin']));
            expect(res.status).toBe(200);
            expect(state.invoked).toBe(true);
        });
    });

    describe('DENY — unauthorized roles are blocked server-side (403), handler NOT invoked', () => {
        it.each(NON_ADMIN_ROLES)('role "%s" → 403 and handler NOT invoked', async (role) => {
            const { handler, state } = makeSpyHandler();
            const guarded = requireAdmin(handler);

            const res = await guarded(makeCtx([role]));

            await expectServerDeny403(res);
            expect(state.invoked).toBe(false);
        });

        it('denies a user with an empty role array', async () => {
            const { handler, state } = makeSpyHandler();
            const res = await requireAdmin(handler)(makeCtx([]));
            await expectServerDeny403(res);
            expect(state.invoked).toBe(false);
        });

        it('denies a user with several non-admin roles (no admin in set)', async () => {
            const { handler, state } = makeSpyHandler();
            const res = await requireAdmin(handler)(makeCtx(['learner', 'recruiter', 'viewer']));
            await expectServerDeny403(res);
            expect(state.invoked).toBe(false);
        });

        it('denies when no user is present on the context (defense in depth)', async () => {
            const { handler, state } = makeSpyHandler();
            const res = await requireAdmin(handler)(makeCtx(undefined));
            await expectServerDeny403(res);
            expect(state.invoked).toBe(false);
        });
    });
});

// ── requireRole generic primitive (re-exported via functions/lib/auth) ────────
// The reusable guard that backs requireAdmin and any role-subset gate. We prove
// the allow/deny decision for two representative subsets called out in the
// guard matrix.
describe('Enforcement: requireRole role-subset guard', () => {
    const SCHOOL_ADMIN_SUBSET = ['school_admin', 'college_admin', 'university_admin'];
    const RECRUITER_SUBSET = ['recruiter', 'company_admin'];

    describe('school-admin subset', () => {
        it.each(SCHOOL_ADMIN_SUBSET)('ALLOW: "%s" → 200', async (role) => {
            const { handler, state } = makeSpyHandler();
            const res = await requireRole(SCHOOL_ADMIN_SUBSET, handler)(makeCtx([role]));
            expect(res.status).toBe(200);
            expect(state.invoked).toBe(true);
        });

        it.each(['learner', 'recruiter', 'school_educator'])('DENY: "%s" → 403, handler NOT invoked', async (role) => {
            const { handler, state } = makeSpyHandler();
            const res = await requireRole(SCHOOL_ADMIN_SUBSET, handler)(makeCtx([role]));
            await expectServerDeny403(res);
            expect(state.invoked).toBe(false);
        });
    });

    describe('recruiter subset', () => {
        it.each(RECRUITER_SUBSET)('ALLOW: "%s" → 200', async (role) => {
            const { handler, state } = makeSpyHandler();
            const res = await requireRole(RECRUITER_SUBSET, handler)(makeCtx([role]));
            expect(res.status).toBe(200);
            expect(state.invoked).toBe(true);
        });

        it.each(['learner', 'school_admin', 'viewer'])('DENY: "%s" → 403, handler NOT invoked', async (role) => {
            const { handler, state } = makeSpyHandler();
            const res = await requireRole(RECRUITER_SUBSET, handler)(makeCtx([role]));
            await expectServerDeny403(res);
            expect(state.invoked).toBe(false);
        });
    });

    it('accepts a single role string (not just an array)', async () => {
        const { handler, state } = makeSpyHandler();
        const allow = await requireRole('recruiter', handler)(makeCtx(['recruiter']));
        expect(allow.status).toBe(200);
        expect(state.invoked).toBe(true);

        const { handler: h2, state: s2 } = makeSpyHandler();
        const deny = await requireRole('recruiter', h2)(makeCtx(['learner']));
        await expectServerDeny403(deny);
        expect(s2.invoked).toBe(false);
    });
});

// ── Shared ADMIN_ROLES group (backs the in-handler admin-bypass endpoints) ────
// Endpoints whose admin check is an in-handler ownership/scope bypass rather than
// a blanket guard — storage/upload-url, storage/download-url, resume/save,
// learners/{trainings,management,by-email,dashboard,data}, educator/dashboard,
// ai-tutor/{get-learner-type,get-generation-usage}, streak/reset-daily — all
// decide via `user.roles.some(r => ADMIN_ROLES.includes(r))`. Their correctness
// depends on the SINGLE shared ADMIN_ROLES group being right (replacing the
// per-handler inline literals — bug §7.1). We assert that group directly so the
// admin/non-admin partition every such endpoint relies on is validated.
describe('Enforcement: shared ADMIN_ROLES group (in-handler admin-bypass endpoints)', () => {
    it('contains exactly the canonical admin role-category group', () => {
        expect([...ADMIN_ROLES]).toEqual([
            'admin',
            'company_admin',
            'owner',
            'school_admin',
            'college_admin',
            'university_admin',
        ]);
    });

    it('every non-admin role is excluded from ADMIN_ROLES (would be denied admin bypass)', () => {
        for (const role of NON_ADMIN_ROLES) {
            expect(ADMIN_ROLES.includes(role)).toBe(false);
        }
    });

    it('admin-bypass predicate allows admins and blocks non-admins (the in-handler check)', () => {
        // Mirrors the exact predicate used in upload-url/download-url/streak/etc.
        const isAdmin = (roles: string[]) => roles.some((r) => ADMIN_ROLES.includes(r));
        expect(isAdmin(['school_admin'])).toBe(true);
        expect(isAdmin(['company_admin'])).toBe(true);
        expect(isAdmin(['learner'])).toBe(false);
        expect(isAdmin(['super_admin'])).toBe(false); // system ≠ admin
        expect(isAdmin([])).toBe(false);
    });
});
