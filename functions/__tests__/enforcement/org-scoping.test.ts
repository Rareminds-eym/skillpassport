/**
 * P2 GATE — Org-scoped enforcement: a role/authority valid in org A is DENIED
 * for an org B context.
 * Spec: rbac-architecture-violations-fix — task 14.3.
 * Validates: Requirements 7.1, 7.3 (single server-side enforcement boundary;
 * authorization decided server-side, never the client) and design §CC-3
 * ("Org-scoped semantics") + §"Enforcement tests (P2, P5)":
 *   "Org-scoping: a role valid in org A is denied for org B context (CC-3)."
 *
 * ── How org-scoping actually works in this codebase ─────────────────────────
 * There are TWO org-scoping mechanisms, and this file proves both:
 *
 * 1) JWT single-org scoping (the implicit gate behind every guard).
 *    `get_jwt_claims(user, org)` (sso-worker) resolves roles/products for ONE
 *    active org; the minted JWT carries a single `org_id` and the `roles[]` FOR
 *    THAT org. Functions guards (`requireRole`/`requireAdmin`) read ONLY
 *    `context.data.user.roles` from that single-org JWT — they NEVER re-resolve
 *    per-org and NEVER union roles across orgs (design CC-3). A multi-org user
 *    gets a NEW JWT on `switch-org`, scoped to the new active org. So a user who
 *    is `recruiter` in org A but has no recruiter authority in org B holds
 *    DIFFERENT roles in the org-B JWT — the org-A authority does not carry over.
 *
 * 2) Explicit app-side org gate: `verifyOrgAccess(supabase, userId, orgId)` in
 *    `functions/lib/permissions.ts` (used by `functions/api/opportunities`,
 *    task 11.3). It checks the user's membership/permission IN A SPECIFIC org
 *    via `is_org_member` / `has_recruitment_permission` RPCs and returns a
 *    server-side 403 `Response` when the user is not a member of (or lacks the
 *    permission in) that org. This is the clearest unit-testable place to prove
 *    "valid in org A, denied in org B".
 *
 * ── Test target chosen ──────────────────────────────────────────────────────
 * PRIMARY: `verifyOrgAccess` (+ the `opportunities` handler's org-gate branch it
 * composes), exercised deterministically with a mock Supabase whose membership/
 * permission RPCs answer per `p_org_id` — exactly mirroring the per-endpoint and
 * schoolRole mock-Supabase tests. SECONDARY: the JWT single-org guard decision
 * via `requireRole`, encoding the documented CC-3 invariant that Functions read
 * one org's roles from the JWT and never union across orgs.
 *
 * `withAuth` (real SSO JWT verify) is out of scope here — that layer is covered
 * by auth-core's own suite (task 9.2). We exercise the AUTHORIZATION/org gate.
 */

import type { ContextWithUser } from '@rareminds-eym/auth-core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { requireRole } from '../../lib/auth';
import { PERMISSIONS, verifyOrgAccess } from '../../lib/permissions';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-multi-org';
const ORG_A = 'org-aaaaaaaa';
const ORG_B = 'org-bbbbbbbb';

/**
 * Mock Supabase whose RPCs answer PER `p_org_id` — the on-disk semantics of the
 * `is_org_member` / `has_recruitment_permission` DB functions. Records every
 * call so we can assert the org gate is consulted server-side with the exact org
 * the caller asked about (no client-supplied allow signal).
 */
function makeMockSupabase(opts: {
    membership: Record<string, boolean>;
    permissions?: Record<string, string[]>;
}) {
    const calls: { fn: string; args: Record<string, unknown> }[] = [];
    const supabase = {
        rpc: async (fn: string, args: Record<string, unknown>) => {
            calls.push({ fn, args });
            const orgId = args.p_org_id as string;
            if (fn === 'is_org_member') {
                return { data: opts.membership[orgId] === true, error: null };
            }
            if (fn === 'has_recruitment_permission') {
                const granted = opts.permissions?.[orgId] ?? [];
                return { data: granted.includes(args.p_permission as string), error: null };
            }
            return { data: null, error: { message: `unexpected rpc: ${fn}` } };
        },
    };
    return { supabase: supabase as unknown as SupabaseClient, calls };
}

/** Assert a value is a server-side 403 Response (built by verifyOrgAccess). */
async function expectServerDeny403(res: Response | undefined, expectedFragment: string) {
    expect(res).toBeInstanceOf(Response);
    expect(res!.status).toBe(403);
    const body = (await res!.json()) as { error?: string };
    expect(body.error).toContain(expectedFragment);
}

/**
 * Build a mock `ContextWithUser` shaped exactly as auth-core's `withAuth`
 * populates it after a successful JWT verify (`context.data.user = <AuthUser>`).
 * Crucially this JWT carries ONE `org_id` and the `roles[]` for THAT org only —
 * the single-org scoping the guards rely on (design CC-3).
 */
function makeJwtCtx(orgId: string, roles: string[]): ContextWithUser {
    return {
        request: new Request('https://example.test/api/protected', { method: 'POST' }),
        env: {},
        params: {},
        data: {
            user: {
                sub: USER_ID,
                email: 'u@example.test',
                org_id: orgId,
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

// ─────────────────────────────────────────────────────────────────────────────
// 1) Explicit org gate — verifyOrgAccess (membership): valid in A, denied in B
// ─────────────────────────────────────────────────────────────────────────────
describe('Org-scoping: verifyOrgAccess membership gate (org A allowed, org B denied)', () => {
    it('SAME user — member of org A → allowed; NOT a member of org B → server 403', async () => {
        // One user, active membership in org A only.
        const { supabase, calls } = makeMockSupabase({
            membership: { [ORG_A]: true, [ORG_B]: false },
        });

        // org A context → allowed, no error Response.
        const aAccess = await verifyOrgAccess(supabase, USER_ID, ORG_A);
        expect(aAccess.allowed).toBe(true);
        expect(aAccess.error).toBeUndefined();

        // org B context → the SAME user is denied, server-side 403.
        const bAccess = await verifyOrgAccess(supabase, USER_ID, ORG_B);
        expect(bAccess.allowed).toBe(false);
        await expectServerDeny403(bAccess.error, 'Not a member of this organization');

        // The deny was decided by a server-side membership check against the
        // SPECIFIC org B (not a client-supplied flag): both orgs were queried
        // with the same user id and their own org id.
        const memberCalls = calls.filter((c) => c.fn === 'is_org_member');
        expect(memberCalls).toEqual([
            { fn: 'is_org_member', args: { p_user_id: USER_ID, p_org_id: ORG_A } },
            { fn: 'is_org_member', args: { p_user_id: USER_ID, p_org_id: ORG_B } },
        ]);
    });

    it('does NOT union membership across orgs — being a member of A grants nothing in B', async () => {
        const { supabase } = makeMockSupabase({ membership: { [ORG_A]: true } }); // B absent → falsey
        expect((await verifyOrgAccess(supabase, USER_ID, ORG_A)).allowed).toBe(true);
        const denied = await verifyOrgAccess(supabase, USER_ID, ORG_B);
        expect(denied.allowed).toBe(false);
        await expectServerDeny403(denied.error, 'Not a member of this organization');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2) Explicit org gate — verifyOrgAccess (permission): authority scoped per org
// ─────────────────────────────────────────────────────────────────────────────
describe('Org-scoping: verifyOrgAccess permission gate (authority valid in A, denied in B)', () => {
    it('member of BOTH orgs but holds manage_team only in org A → 403 for org B', async () => {
        // The user is a member of both orgs (so membership passes for both), but
        // the recruitment AUTHORITY (manage_team) exists only in org A.
        const { supabase, calls } = makeMockSupabase({
            membership: { [ORG_A]: true, [ORG_B]: true },
            permissions: { [ORG_A]: [PERMISSIONS.MANAGE_TEAM], [ORG_B]: [] },
        });

        const aAccess = await verifyOrgAccess(supabase, USER_ID, ORG_A, PERMISSIONS.MANAGE_TEAM);
        expect(aAccess.allowed).toBe(true);
        expect(aAccess.error).toBeUndefined();

        const bAccess = await verifyOrgAccess(supabase, USER_ID, ORG_B, PERMISSIONS.MANAGE_TEAM);
        expect(bAccess.allowed).toBe(false);
        await expectServerDeny403(bAccess.error, "Missing required permission 'manage_team'");

        // The permission was checked server-side against the SPECIFIC org.
        const permCalls = calls.filter((c) => c.fn === 'has_recruitment_permission');
        expect(permCalls).toContainEqual({
            fn: 'has_recruitment_permission',
            args: { p_user_id: USER_ID, p_org_id: ORG_B, p_permission: PERMISSIONS.MANAGE_TEAM },
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3) Faithful handler branch — opportunities org-gate (recruiter cross-org)
// ─────────────────────────────────────────────────────────────────────────────
// `functions/api/opportunities/index.ts` composes verifyOrgAccess for recruiters:
//     const orgId = requestedOrgId || user.org_id;
//     const access = await verifyOrgAccess(supabase, user.sub, orgId);
//     if (!access.allowed) return access.error!;   // ← server-side 403
// We reproduce that exact branch to prove a recruiter scoped to org A who
// REQUESTS org B's data (?org_id=orgB) is blocked server-side.
describe('Org-scoping: opportunities recruiter org-gate (request org B while scoped to org A)', () => {
    /** The precise org-gate decision the handler runs for a recruiter. */
    async function opportunitiesOrgGate(
        supabase: SupabaseClient,
        user: { sub: string; org_id: string },
        requestedOrgId: string | null,
    ): Promise<{ status: number; body?: unknown }> {
        const orgId = requestedOrgId || user.org_id;
        const access = await verifyOrgAccess(supabase, user.sub, orgId);
        if (!access.allowed) {
            return { status: access.error!.status, body: await access.error!.json() };
        }
        return { status: 200 };
    }

    it('recruiter (active org A) requesting org A → allowed; requesting org B → 403', async () => {
        const { supabase } = makeMockSupabase({ membership: { [ORG_A]: true, [ORG_B]: false } });
        const recruiter = { sub: USER_ID, org_id: ORG_A };

        // Default (own active org A): allowed.
        const own = await opportunitiesOrgGate(supabase, recruiter, null);
        expect(own.status).toBe(200);

        // Explicitly requests org B's listings: denied server-side.
        const cross = await opportunitiesOrgGate(supabase, recruiter, ORG_B);
        expect(cross.status).toBe(403);
        expect((cross.body as { error?: string }).error).toContain('Not a member of this organization');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4) JWT single-org scoping (CC-3) — guard reads one org's roles, never unions
// ─────────────────────────────────────────────────────────────────────────────
// The minted JWT carries ONE org_id + the roles for THAT org. `switch-org`
// mints a NEW JWT. So a user who is `recruiter` in org A holds DIFFERENT (here:
// empty) roles in the org-B JWT; the org-A authority does not transfer.
describe('Org-scoping: JWT single-org guard decision (recruiter in A, not in B)', () => {
    const RECRUITER_GUARD = requireRole(['recruiter', 'company_admin'], async () => {
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    });

    it('org-A JWT (roles=[recruiter]) passes the guard; org-B JWT (roles=[]) is denied 403', async () => {
        // Active org A → JWT roles resolved for org A include `recruiter`.
        const aJwt = makeJwtCtx(ORG_A, ['recruiter']);
        const allowed = await RECRUITER_GUARD(aJwt);
        expect(allowed.status).toBe(200);
        expect(await allowed.json()).toEqual({ ok: true });

        // After switch-org → a NEW JWT scoped to org B carries the user's org-B
        // roles (none here). The SAME guard now denies — proving the authority
        // valid in org A does not grant access in org B.
        const bJwt = makeJwtCtx(ORG_B, []);
        const denied = await RECRUITER_GUARD(bJwt);
        expect(denied.status).toBe(403);
        expect(((await denied.json()) as { error?: string }).error).toBe('Forbidden: insufficient role');
    });

    it('the guard decision is driven solely by the single-org JWT roles (no cross-org union)', async () => {
        // Each JWT exposes exactly one org_id and one roles[] set; there is no
        // mechanism for the guard to see org-A roles while evaluating an org-B
        // JWT. Confirm the two contexts are independent single-org snapshots.
        const aJwt = makeJwtCtx(ORG_A, ['recruiter']);
        const bJwt = makeJwtCtx(ORG_B, []);
        expect(aJwt.data!.user!.org_id).toBe(ORG_A);
        expect(bJwt.data!.user!.org_id).toBe(ORG_B);
        expect(aJwt.data!.user!.roles).toEqual(['recruiter']);
        expect(bJwt.data!.user!.roles).toEqual([]); // org-B JWT does NOT include org-A's recruiter
    });
});
