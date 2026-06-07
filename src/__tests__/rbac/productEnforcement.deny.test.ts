/**
 * Server-side PRODUCT enforcement contract — `requireProduct` deny/allow tests.
 *
 * Spec: rbac-architecture-violations-fix — Task 23.2 (Phase P5)
 * **Validates: Requirements 9.1**
 * Design: Property 9 (Product/feature enforcement) · error table row
 *         "Missing product → 403 'Forbidden: product access denied'".
 *
 * WHY THIS TEST EXISTS (and why it does NOT 403 real users)
 * ---------------------------------------------------------
 * Task 23.1 mapped every product-feature endpoint to the single product code
 * `skillpassport`, but found that the JWT `products[]` claim is currently EMPTY for
 * every user (the grant-on-provision fix lives in the separate sso-worker). Wrapping
 * live handlers with `requireProduct('skillpassport')` today would therefore 403 all
 * authenticated users — a behavior-preservation violation. Per the recorded decision
 * (`.kiro/verifications/2026-06-07_p5-product-enforcement-mapping.md`), live handlers
 * are NOT wrapped yet.
 *
 * Instead, this test PROVES the server-side product-enforcement CONTRACT directly
 * against fabricated auth contexts, so the deny/allow behavior is verified independent
 * of seed/backfill state. The guard exercised is the SAME one the app handlers wire in
 * — `requireProduct`, imported here through the app boundary re-export in
 * `functions/lib/auth.ts` (which re-exports the `auth-core` guard verbatim). Proving the
 * contract here does not touch any live handler, so no real user is denied.
 *
 * THE CONTRACT (auth-core/src/middleware/requireProduct.ts)
 * ---------------------------------------------------------
 *   requireProduct(product: string | string[], handler) returns a guard that:
 *     - DENIES with 403 `Forbidden: product access denied` (JSON, never calling the
 *       handler) when there is no user, no `user.products`, or NONE of the required
 *       products are present in `user.products`.
 *     - ALLOWS (invokes the wrapped handler and returns its Response) when at least one
 *       required product is present in `user.products` (any-of semantics).
 *
 * Deterministic and DB-independent: the JWT claim (`data.user.products`) is fabricated
 * directly; nothing here reads the database, seed, or network.
 */

import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';

// Guard under test — imported via the APP BOUNDARY re-export (functions/lib/auth.ts:164),
// which re-exports the auth-core guard verbatim. This is the exact symbol the product-gated
// handlers compose inside `withAuth`, so testing it here covers the server-side app boundary.
import type { AuthUser, ContextWithUser } from '@rareminds-eym/auth-core';
import { requireProduct } from '../../../functions/lib/auth';

// ── Fabricated auth-context helpers (no DB / no network) ────────────────────
const PRODUCT = 'skillpassport'; // the single product code served by this app (Task 23.1)
const OTHER_PRODUCT = 'lte'; // the other SSO product code, NOT served by this app

function createMockUser(overrides: Partial<AuthUser> = {}): AuthUser {
    return {
        sub: 'user-123',
        email: 'user@example.com',
        org_id: 'org-1',
        roles: ['learner'],
        products: [PRODUCT],
        membership_status: 'active',
        is_email_verified: true,
        ...overrides,
    };
}

function createMockContext(overrides: Partial<ContextWithUser> = {}): ContextWithUser {
    return {
        request: new Request('https://example.com/api/product-feature'),
        env: {},
        params: {},
        data: { user: createMockUser() },
        waitUntil: () => { },
        passThroughOnException: () => { },
        ...overrides,
    };
}

const DENY_MESSAGE = 'Forbidden: product access denied';

async function bodyError(res: Response): Promise<string> {
    return ((await res.json()) as { error: string }).error;
}

describe('Task 23.2 — server-side product enforcement (requireProduct contract)', () => {
    // ── DENY paths ──────────────────────────────────────────────────────────
    it('DENY: user.products does NOT include the required product → 403, handler NOT invoked', async () => {
        const context = createMockContext({ data: { user: createMockUser({ products: [OTHER_PRODUCT] }) } });
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        const guarded = requireProduct(PRODUCT, handler);
        const result = await guarded(context);

        expect(handler).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
        expect(await bodyError(result)).toBe(DENY_MESSAGE);
        expect(result.headers.get('Content-Type')).toBe('application/json');
    });

    it('DENY: user.products is empty [] → 403, handler NOT invoked', async () => {
        const context = createMockContext({ data: { user: createMockUser({ products: [] }) } });
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        const result = await requireProduct(PRODUCT, handler)(context);

        expect(handler).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
        expect(await bodyError(result)).toBe(DENY_MESSAGE);
    });

    it('DENY: user.products is undefined → 403, handler NOT invoked', async () => {
        // products omitted entirely (claim absent) — the guard treats this as no access.
        const userWithoutProducts = createMockUser();
        delete (userWithoutProducts as Partial<AuthUser>).products;
        const context = createMockContext({ data: { user: userWithoutProducts } });
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        const result = await requireProduct(PRODUCT, handler)(context);

        expect(handler).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
        expect(await bodyError(result)).toBe(DENY_MESSAGE);
    });

    it('DENY: no authenticated user on the context → 403, handler NOT invoked', async () => {
        const context = createMockContext({ data: {} });
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        const result = await requireProduct(PRODUCT, handler)(context);

        expect(handler).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
        expect(await bodyError(result)).toBe(DENY_MESSAGE);
    });

    it('DENY (any-of): required as an array, user has NONE of them → 403, handler NOT invoked', async () => {
        const context = createMockContext({ data: { user: createMockUser({ products: ['unrelated-product'] }) } });
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        const result = await requireProduct([PRODUCT, OTHER_PRODUCT], handler)(context);

        expect(handler).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
        expect(await bodyError(result)).toBe(DENY_MESSAGE);
    });

    // ── ALLOW paths ─────────────────────────────────────────────────────────
    it("ALLOW: user.products includes the required product 'skillpassport' → handler invoked, passes through 200", async () => {
        const context = createMockContext({ data: { user: createMockUser({ products: [PRODUCT] }) } });
        const handlerResponse = new Response('ok', { status: 200 });
        const handler = vi.fn(() => handlerResponse);

        const result = await requireProduct(PRODUCT, handler)(context);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(context);
        expect(result).toBe(handlerResponse);
        expect(result.status).toBe(200);
    });

    it('ALLOW: required product present alongside others → handler invoked', async () => {
        const context = createMockContext({ data: { user: createMockUser({ products: [PRODUCT, OTHER_PRODUCT] }) } });
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        const result = await requireProduct(PRODUCT, handler)(context);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(result.status).toBe(200);
    });

    it('ALLOW (any-of): required as an array, user has at least one → handler invoked', async () => {
        // user holds only the OTHER product, but it is one of the accepted set → allow.
        const context = createMockContext({ data: { user: createMockUser({ products: [OTHER_PRODUCT] }) } });
        const handler = vi.fn(() => new Response('ok', { status: 200 }));

        const result = await requireProduct([PRODUCT, OTHER_PRODUCT], handler)(context);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(result.status).toBe(200);
    });

    // ── Property: any-of semantics across arbitrary product sets ──────────────
    /**
     * Property (supports design Property 9 / Requirement 9.1): for ANY set of required
     * products and ANY set of the user's products, `requireProduct` ALLOWS (handler invoked,
     * non-403) iff the two sets intersect, and otherwise DENIES with 403 and never invokes
     * the handler. This is the universal form of the deny/allow contract.
     * **Validates: Requirements 9.1**
     */
    it('property: allows iff required ∩ user-products ≠ ∅, else 403 and handler not invoked', async () => {
        const productPool = ['skillpassport', 'lte', 'alpha', 'beta', 'gamma'];
        const productArb = fc.subarray(productPool);

        await fc.assert(
            fc.asyncProperty(
                fc.subarray(productPool, { minLength: 1 }), // required (string[] form, ≥1)
                productArb, // the user's products[]
                async (required, userProducts) => {
                    const context = createMockContext({
                        data: { user: createMockUser({ products: userProducts }) },
                    });
                    const handler = vi.fn(() => new Response('handler-body', { status: 200 }));

                    const result = await requireProduct(required, handler)(context);

                    const shouldAllow = required.some((p) => userProducts.includes(p));
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
