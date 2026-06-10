/**
 * Server-side FEATURE/ADD-ON enforcement contract — `requireFeatureAccess` deny/allow tests.
 *
 * Spec: rbac-architecture-violations-fix — Task 24.4 (Phase P5)
 * **Validates: Requirements 9.2, 9.3, 9.4**
 * Design: Property 9 (Product/feature enforcement) — "feature-gated Functions verify
 *         entitlement server-side; client gates are UX-only" (FC-12).
 *
 * WHY THIS TEST EXISTS (and why it does NOT 403 real users)
 * ---------------------------------------------------------
 * Task 24.1 implemented the canonical server-side entitlement read
 * (`functions/lib/entitlements.ts` → `hasAnyFeature`) and Task 10.2 wired it into the
 * app guard `requireFeatureAccess` (`functions/lib/auth.ts`), which binds the GENERIC
 * auth-core `requireFeature` to the app-side `entitlementCheck`. Live handlers are NOT
 * wrapped yet (Task 24.2 deferred): the subscription/entitlement shadow caches
 * (`subscription_cache`/`plans_cache`/`user_entitlements`) are not broadly populated by
 * the SSO entitlement sync, so wrapping live endpoints today would 403 real users — a
 * behavior-preservation violation (same precedent as Task 23.2 for `requireProduct`).
 *
 * Instead, this test PROVES the server-side feature-enforcement CONTRACT directly,
 * driving the SAME guard the live handlers will wire in (`requireFeatureAccess`) through
 * its real entitlement read against FABRICATED shadow state. The Supabase service client
 * is mocked so the entitlement state is injected directly — nothing reads a real DB,
 * seed, or network, so no live handler is touched and no real user is denied. This makes
 * the deny/allow behavior verifiable independent of seed/backfill state.
 *
 * THE CONTRACT (auth-core requireFeature + functions/lib/auth.ts requireFeatureAccess)
 * -----------------------------------------------------------------------------------
 *   requireFeatureAccess(featureKey: string | string[], handler) returns a guard that:
 *     - DENIES with 403 `Forbidden: feature not available` (JSON, never calling the
 *       handler) when the server-side entitlement read grants NONE of the requested keys.
 *     - ALLOWS (invokes the wrapped handler and returns its Response) when the server-side
 *       read grants AT LEAST ONE requested key (any-of semantics), where a key is granted
 *       by: the active subscription plan's features, the freemium baseline, OR a purchased
 *       add-on (`user_entitlements`).
 *     - FAILS CLOSED (deny / no gated response) on empty keys, DB errors, and missing
 *       identity.
 *
 * "CLIENT GATE IS NOT THE SOLE GATE" (Requirement 9.3)
 * ----------------------------------------------------
 * Task 24.3 demoted `featureGating.ts`/`useFeatureGate`/`PlanFeatureGate`/
 * `FeatureLockOverlay` to UX-only affordances. The dedicated test below simulates a
 * request that BYPASSES the client gate (calls the wrapped server handler directly, as a
 * crafted/non-UI client would) for a user lacking entitlement, and asserts the server
 * STILL returns 403 — proving server-side enforcement is independent of any client check.
 *
 * Deterministic and DB-independent: the entitlement state is fabricated via a Supabase
 * query-builder mock; nothing here reads the database, seed, or network.
 */

import fc from 'fast-check';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser, ContextWithUser } from '@rareminds-eym/auth-core';
import type { SupabaseClient } from '@supabase/supabase-js';

// ── Mock the app-DB service client so entitlement state is injected directly ──
// `requireFeatureAccess`'s bound `entitlementCheck` resolves the Supabase client via
// `getServiceClient(env)` (functions/lib/supabase.ts). We replace it with a controllable
// in-memory mock so the REAL entitlement read (`hasAnyFeature` → `checkServerFeatureAccess`
// + `user_entitlements`) runs end-to-end against fabricated shadow rows — no DB/network.
const mockState = vi.hoisted(() => ({ client: null as unknown as SupabaseClient }));
vi.mock('../../../functions/lib/supabase', () => ({
    getServiceClient: () => mockState.client,
}));

// Guard under test — imported via the APP BOUNDARY (functions/lib/auth.ts), the exact
// symbol feature-gated handlers compose inside `withAuth`.
import { requireFeatureAccess } from '../../../functions/lib/auth';

const DENY_MESSAGE = 'Forbidden: feature not available';

// ── Fabricated Supabase shadow-state mock (no DB / no network) ───────────────
/**
 * Builds a Supabase mock serving the two entitlement sources the real read consults:
 *   - `subscription_cache` SELECT → the configured subscription row (or null/error)
 *   - `user_entitlements`  SELECT → an add-on row iff the queried `feature_key` ∈ addonKeys
 *
 * The builder records the `.eq('feature_key', <key>)` filter so per-key add-on
 * entitlement can be modelled precisely (needed by the property test).
 */
function makeSupabaseMock(opts: {
    subscription?: { status: string; plan_code: string; features: string[]; synced_at: string } | null;
    subscriptionError?: { message: string } | null;
    addonKeys?: ReadonlySet<string>;
    addonError?: { message: string; code?: string } | null;
} = {}): SupabaseClient {
    const builder = (table: string) => {
        let featureKeyFilter: string | undefined;
        const chain: any = {
            select() { return chain; },
            eq(col: string, val: string) {
                if (col === 'feature_key') featureKeyFilter = val;
                return chain;
            },
            in() { return chain; },
            gt() { return chain; },
            limit() { return chain; },
            maybeSingle() {
                if (table === 'subscription_cache') {
                    return Promise.resolve({
                        data: opts.subscription ?? null,
                        error: opts.subscriptionError ?? null,
                    });
                }
                if (table === 'user_entitlements') {
                    if (opts.addonError) {
                        return Promise.resolve({ data: null, error: opts.addonError });
                    }
                    const granted =
                        featureKeyFilter !== undefined && (opts.addonKeys?.has(featureKeyFilter) ?? false);
                    return Promise.resolve({
                        data: granted ? { id: `ent-${featureKeyFilter}` } : null,
                        error: null,
                    });
                }
                return Promise.resolve({ data: null, error: null });
            },
        };
        return chain;
    };
    return { from: (table: string) => builder(table) } as unknown as SupabaseClient;
}

const FRESH = new Date().toISOString();

function createMockUser(overrides: Partial<AuthUser> = {}): AuthUser {
    return {
        sub: 'user-123',
        email: 'user@example.com',
        org_id: 'org-1',
        roles: ['learner'],
        products: ['skillpassport'],
        membership_status: 'active',
        is_email_verified: true,
        ...overrides,
    };
}

function createMockContext(overrides: Partial<ContextWithUser> = {}): ContextWithUser {
    return {
        request: new Request('https://example.com/api/feature-gated'),
        env: {},
        params: {},
        data: { user: createMockUser() },
        waitUntil: () => { },
        passThroughOnException: () => { },
        ...overrides,
    } as ContextWithUser;
}

async function bodyError(res: Response): Promise<string> {
    return ((await res.json()) as { error: string }).error;
}

describe('Task 24.4 — server-side feature enforcement (requireFeatureAccess contract)', () => {
    beforeEach(() => {
        // Default: a paid plan that grants nothing unless a test overrides it.
        mockState.client = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'professional', features: [], synced_at: FRESH },
        });
    });

    // ── DENY paths ──────────────────────────────────────────────────────────
    it('DENY: user has NO entitling plan feature or add-on for the key → 403, handler NOT invoked', async () => {
        mockState.client = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'professional', features: ['analytics'], synced_at: FRESH },
            addonKeys: new Set(),
        });
        const context = createMockContext();
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        const result = await requireFeatureAccess('mock_interviews', handler)(context);

        expect(handler).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
        expect(await bodyError(result)).toBe(DENY_MESSAGE);
        expect(result.headers.get('Content-Type')).toBe('application/json');
    });

    it('DENY: no active subscription and no add-on → 403, handler NOT invoked', async () => {
        mockState.client = makeSupabaseMock({ subscription: null, addonKeys: new Set() });
        const context = createMockContext();
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        const result = await requireFeatureAccess('analytics', handler)(context);

        expect(handler).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
        expect(await bodyError(result)).toBe(DENY_MESSAGE);
    });

    it('DENY (any-of): array of keys, user entitled to NONE → 403, handler NOT invoked', async () => {
        mockState.client = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'professional', features: ['analytics'], synced_at: FRESH },
            addonKeys: new Set(['career_ai']),
        });
        const context = createMockContext();
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        // requests 'portfolio' + 'mock_interviews'; user has neither (has analytics + career_ai add-on)
        const result = await requireFeatureAccess(['portfolio', 'mock_interviews'], handler)(context);

        expect(handler).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
        expect(await bodyError(result)).toBe(DENY_MESSAGE);
    });

    // ── Fail-closed edges ─────────────────────────────────────────────────────
    it('FAIL-CLOSED: empty key list → 403, handler NOT invoked', async () => {
        mockState.client = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'professional', features: ['analytics'], synced_at: FRESH },
        });
        const context = createMockContext();
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        const result = await requireFeatureAccess([], handler)(context);

        expect(handler).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
        expect(await bodyError(result)).toBe(DENY_MESSAGE);
    });

    it('FAIL-CLOSED: DB error while reading entitlement state → 403, handler NOT invoked', async () => {
        // subscription_cache read errors AND add-on read errors → no source can grant → deny.
        mockState.client = makeSupabaseMock({
            subscriptionError: { message: 'connection reset' },
            addonError: { message: 'relation does not exist', code: '42P01' },
        });
        const context = createMockContext();
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        const result = await requireFeatureAccess('analytics', handler)(context);

        expect(handler).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
        expect(await bodyError(result)).toBe(DENY_MESSAGE);
    });

    it('FAIL-CLOSED: missing authenticated user → no gated response, handler NOT invoked', async () => {
        // In production `withAuth` returns 401 before this guard runs; this asserts the
        // defense-in-depth fail-closed: with no `data.user`, the entitlement read cannot
        // resolve an identity, so the guard never invokes the wrapped handler and no gated
        // data is returned (it rejects rather than passing through).
        const context = createMockContext({ data: {} } as Partial<ContextWithUser>);
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        await expect(requireFeatureAccess('analytics', handler)(context)).rejects.toBeInstanceOf(Error);
        expect(handler).not.toHaveBeenCalled();
    });

    // ── ALLOW paths ───────────────────────────────────────────────────────────
    it('ALLOW: key included in the active plan features → handler invoked, passes through 200', async () => {
        mockState.client = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'professional', features: ['analytics'], synced_at: FRESH },
        });
        const context = createMockContext();
        const handlerResponse = new Response('ok', { status: 200 });
        const handler = vi.fn(() => handlerResponse);

        const result = await requireFeatureAccess('analytics', handler)(context);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(context);
        expect(result).toBe(handlerResponse);
        expect(result.status).toBe(200);
    });

    it('ALLOW: freemium baseline feature without a paid plan → handler invoked', async () => {
        mockState.client = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'freemium', features: [], synced_at: FRESH },
        });
        const context = createMockContext();
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        // 'dashboard_access' is part of the freemium baseline (server-feature-gating.ts).
        const result = await requireFeatureAccess('dashboard_access', handler)(context);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(result.status).toBe(200);
    });

    it('ALLOW via add-on: plan lacks the feature but an active user_entitlements row grants it → handler invoked', async () => {
        mockState.client = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'freemium', features: [], synced_at: FRESH },
            addonKeys: new Set(['career_ai']),
        });
        const context = createMockContext();
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        const result = await requireFeatureAccess('career_ai', handler)(context);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(result.status).toBe(200);
    });

    it('ALLOW (any-of): array of keys, user entitled to at least one → handler invoked', async () => {
        mockState.client = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'professional', features: ['analytics'], synced_at: FRESH },
            addonKeys: new Set(),
        });
        const context = createMockContext();
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        // requests a feature the user lacks ('portfolio') plus one they have ('analytics').
        const result = await requireFeatureAccess(['portfolio', 'analytics'], handler)(context);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(result.status).toBe(200);
    });

    // ── "Client gate is NOT the sole gate" (Requirement 9.3) ───────────────────
    /**
     * Simulates a request that BYPASSES the UX-only client gate
     * (`featureGating.ts`/`useFeatureGate`/`PlanFeatureGate`/`FeatureLockOverlay`, demoted
     * in Task 24.3) — e.g. a crafted client that skips the React UI entirely and calls the
     * Function directly. For a user with NO entitlement, the server guard STILL returns 403
     * and never runs the handler, proving server-side enforcement is independent of (and
     * not gated by) any client-side check.
     * **Validates: Requirements 9.3**
     */
    it('NOT-THE-SOLE-GATE: a request bypassing the client gate is still denied 403 by the server', async () => {
        // User lacks the entitlement server-side. A client gate decision is irrelevant here:
        // the server is consulted directly and must deny on its own.
        mockState.client = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'freemium', features: [], synced_at: FRESH },
            addonKeys: new Set(),
        });
        const context = createMockContext();
        const handler = vi.fn(() => new Response('GATED-DATA', { status: 200 }));

        // Even if a (UX-only) client gate had said "allow", we never consult it — we invoke
        // the server guard directly, as a bypassing client would reach the Function.
        const clientGateWouldAllow = true; // deliberately ignored by the server
        const result = await requireFeatureAccess('analytics', handler)(context);

        expect(clientGateWouldAllow).toBe(true); // documents the bypass scenario
        expect(handler).not.toHaveBeenCalled(); // server did NOT defer to the client gate
        expect(result.status).toBe(403);
        expect(await bodyError(result)).toBe(DENY_MESSAGE);
    });

    // ── Property: handler invoked IFF ≥1 requested key resolves server-side ────
    /**
     * Property (supports design Property 9 / Requirements 9.2–9.4): for ANY set of requested
     * feature keys and ANY fabricated entitlement state (plan features ∪ purchased add-ons),
     * `requireFeatureAccess` ALLOWS (handler invoked, 200) iff at least one requested key is
     * granted by the server-side read, and otherwise DENIES with 403 and never invokes the
     * handler. This is the universal form of the deny/allow contract, enforced ENTIRELY
     * server-side (independent of any client gate).
     * **Validates: Requirements 9.2, 9.3, 9.4**
     */
    it('property: allows iff ≥1 requested key is granted server-side (plan ∪ add-on), else 403 and handler not invoked', async () => {
        const featurePool = ['analytics', 'portfolio', 'mock_interviews', 'career_ai', 'resume_builder', 'projects'];
        // 'professional' (non-freemium) plan so the freemium baseline never interferes:
        // a key is granted iff it is in the plan features OR in the purchased add-on set.

        await fc.assert(
            fc.asyncProperty(
                fc.subarray(featurePool, { minLength: 1 }), // requested keys (≥1)
                fc.subarray(featurePool), // plan features
                fc.subarray(featurePool), // purchased add-on keys
                async (requested, planFeatures, addonList) => {
                    const addonKeys = new Set(addonList);
                    mockState.client = makeSupabaseMock({
                        subscription: {
                            status: 'active',
                            plan_code: 'professional',
                            features: planFeatures,
                            synced_at: FRESH,
                        },
                        addonKeys,
                    });
                    const context = createMockContext();
                    const handler = vi.fn(() => new Response('handler-body', { status: 200 }));

                    const result = await requireFeatureAccess(requested, handler)(context);

                    const granted = new Set([...planFeatures, ...addonKeys]);
                    const shouldAllow = requested.some((k) => granted.has(k));

                    if (shouldAllow) {
                        expect(handler).toHaveBeenCalledTimes(1);
                        expect(result.status).toBe(200);
                    } else {
                        expect(handler).not.toHaveBeenCalled();
                        expect(result.status).toBe(403);
                        expect(await bodyError(result)).toBe(DENY_MESSAGE);
                    }
                },
            ),
            { numRuns: 50 },
        );
    });
});
