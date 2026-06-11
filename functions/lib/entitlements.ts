/**
 * Server-side feature / add-on ENTITLEMENT resolution (task 24.1, Phase P5).
 *
 * This is the canonical, JWT-verified-boundary entitlement read used by
 * `requireFeatureAccess` in `functions/lib/auth.ts`. It answers a single
 * question — "is this user entitled to feature X (or ANY of features X…Z)?" —
 * by reading ONLY the app-DB shadow/cache state synced from the SSO/auth side:
 *
 *   1. `subscription_cache` / `plans_cache` — the active subscription's plan +
 *      its `features[]` (and freemium baseline), via the existing self-healing
 *      helper `checkServerFeatureAccess` (`functions/shared/lib/server-feature-gating.ts`).
 *   2. `user_entitlements` — purchased ADD-ONS keyed by `feature_key` (the
 *      app-DB shadow of the SSO `addon_purchases`/`bundle_purchases`).
 *
 * CANONICAL STATE IS SSO-SIDE. These tables are read-only shadows kept current
 * by `functions/lib/sync-shadow.ts` (write-through) + the reconcile cron; the
 * authoritative subscription/entitlement source remains the SSO/auth DB,
 * surfaced via `sso-client.ts` RPC. Functions NEVER trust frontend-supplied
 * entitlement state — only this server-side shadow read.
 *
 * FAIL-CLOSED. Every ambiguity (empty/invalid keys, no subscription, DB error,
 * unexpected throw) resolves to DENY. A feature is granted only when a positive
 * entitlement is found. This upholds CC-2 (a guard must never silently open).
 *
 * See: design.md §"Product & Feature Enforcement", bugfix.md §9.2–9.4
 *      (Requirements 9.2, 9.3, 9.4).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { checkServerFeatureAccess } from '../shared/lib/server-feature-gating';

/** Subscription statuses that count as currently-entitling. */
const ENTITLING_STATUSES = ['active', 'grace_period'] as const;

/**
 * Resolve whether the user holds an active purchased ADD-ON entitlement for a
 * single `feature_key`, by reading the `user_entitlements` shadow (app DB).
 *
 * Canonical add-on state lives SSO-side (`addon_purchases`/`bundle_purchases`)
 * and is mirrored into `user_entitlements`. An entitlement counts only when its
 * `status` is one of {@link ENTITLING_STATUSES}.
 *
 * FAIL-CLOSED: any query error (including a missing table, code `42P01`) or
 * unexpected throw resolves to `false`.
 *
 * @param supabase   App-DB service-role client (RLS-bypassing read).
 * @param userId     The authenticated user's id (JWT `sub`).
 * @param featureKey The add-on feature key to check.
 * @returns `true` only when a matching, currently-entitling add-on row exists.
 */
export async function hasActiveAddonEntitlement(
    supabase: SupabaseClient,
    userId: string,
    featureKey: string,
): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('user_entitlements')
            .select('id')
            .eq('user_id', userId)
            .eq('feature_key', featureKey)
            .in('status', ENTITLING_STATUSES as unknown as string[])
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error(
                '[entitlements] user_entitlements read failed (fail-closed):',
                error.message,
            );
            return false;
        }

        return !!data;
    } catch (err) {
        console.error(
            '[entitlements] unexpected error reading user_entitlements (fail-closed):',
            err instanceof Error ? err.message : String(err),
        );
        return false;
    }
}

/**
 * Resolve whether the user is entitled to a SINGLE `feature_key`, considering
 * BOTH sources of entitlement:
 *
 *   1. Subscription plan + freemium baseline (`subscription_cache`/`plans_cache`)
 *      via `checkServerFeatureAccess` (already fail-closed + self-healing).
 *   2. Purchased add-ons (`user_entitlements`) via {@link hasActiveAddonEntitlement}.
 *
 * The add-on lookup is only attempted when the plan check does not already
 * grant access (short-circuit — avoids an extra query for plan-included
 * features).
 *
 * FAIL-CLOSED: returns `false` unless one of the two sources affirmatively
 * grants the feature.
 */
export async function hasFeatureEntitlement(
    supabase: SupabaseClient,
    userId: string,
    featureKey: string,
): Promise<boolean> {
    // 1) Subscription plan / freemium baseline (self-healing, fail-closed).
    const planResult = await checkServerFeatureAccess(supabase, userId, featureKey);
    if (planResult.hasAccess) return true;

    // 2) Purchased add-on entitlement (app-DB shadow of SSO addon_purchases).
    return hasActiveAddonEntitlement(supabase, userId, featureKey);
}

/**
 * Server-side entitlement predicate: does the user have ANY of `keys`?
 *
 * This is the function bound into auth-core's generic `requireFeature` by
 * `requireFeatureAccess` (`functions/lib/auth.ts`). It mirrors the design's
 * `hasAnyFeature(supabase, userId, keys)` contract.
 *
 * Semantics:
 *   - Returns `true` as soon as the FIRST key resolves to an active entitlement
 *     (subscription/plan/freemium OR purchased add-on).
 *   - Returns `false` (DENY) when `userId` is missing, `keys` is empty/invalid,
 *     or none of the keys resolve — i.e. FAIL-CLOSED for every ambiguous input.
 *
 * Reads ONLY server-side shadow state (never frontend-supplied flags), uses
 * parameterized Supabase query builders (no string interpolation), and performs
 * only short, per-request reads (no long-lived cache beyond the shadow tables,
 * preserving CC-1's staleness bound).
 *
 * @param supabase App-DB service-role client.
 * @param userId   Authenticated user's id (JWT `sub`); falsy → DENY.
 * @param keys     One or more feature keys; grant when ANY resolves.
 * @returns `true` iff at least one key is entitled; otherwise `false`.
 */
export async function hasAnyFeature(
    supabase: SupabaseClient,
    userId: string | null | undefined,
    keys: readonly string[],
): Promise<boolean> {
    // Fail-closed on missing identity or empty/invalid key set.
    if (!userId) return false;
    if (!Array.isArray(keys) || keys.length === 0) return false;

    for (const key of keys) {
        if (typeof key !== 'string' || key.length === 0) continue;
        if (await hasFeatureEntitlement(supabase, userId, key)) {
            return true;
        }
    }

    return false;
}
