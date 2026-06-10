/**
 * Unit tests for the server-side entitlement read (task 24.1, Phase P5).
 *
 * Exercises the REAL `hasAnyFeature` / `hasFeatureEntitlement` /
 * `hasActiveAddonEntitlement` against a lightweight Supabase query-builder mock
 * (mirroring the sync-shadow.test.ts style). No network, no real DB.
 *
 * Validates the canonical read contract from design.md §"Product & Feature
 * Enforcement" and bugfix.md §9.2–9.4:
 *   - reads subscription_cache/plans_cache (via checkServerFeatureAccess) AND
 *     user_entitlements add-ons,
 *   - grants on ANY of the requested keys,
 *   - FAILS CLOSED on missing identity, empty/invalid keys, and DB errors.
 *
 * **Validates: Requirements 9.2, 9.3, 9.4**
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import {
    hasActiveAddonEntitlement,
    hasAnyFeature,
    hasFeatureEntitlement,
} from '../entitlements';

/**
 * Builds a Supabase mock that serves:
 *  - `subscription_cache` SELECT → { data: subscription, error }
 *  - `user_entitlements`  SELECT → { data: addonRow, error } (filtered builder)
 *
 * The builder ignores filter args (eq/in/limit) and resolves `.maybeSingle()`
 * to the configured result for the requested table.
 */
function makeSupabaseMock(opts: {
    subscription?: { status: string; plan_code: string; features: string[]; synced_at: string } | null;
    subscriptionError?: { message: string } | null;
    addon?: { id: string } | null;
    addonError?: { message: string; code?: string } | null;
} = {}): SupabaseClient {
    const builder = (table: string) => {
        const chain: any = {
            _table: table,
            select() { return chain; },
            eq() { return chain; },
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
                    return Promise.resolve({
                        data: opts.addon ?? null,
                        error: opts.addonError ?? null,
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

describe('hasActiveAddonEntitlement', () => {
    it('grants when an active add-on row exists', async () => {
        const supabase = makeSupabaseMock({ addon: { id: 'ent-1' } });
        expect(await hasActiveAddonEntitlement(supabase, 'user-1', 'career_ai')).toBe(true);
    });

    it('denies when no add-on row exists', async () => {
        const supabase = makeSupabaseMock({ addon: null });
        expect(await hasActiveAddonEntitlement(supabase, 'user-1', 'career_ai')).toBe(false);
    });

    it('fails closed on a query error (e.g. missing table)', async () => {
        const supabase = makeSupabaseMock({ addonError: { message: 'relation does not exist', code: '42P01' } });
        expect(await hasActiveAddonEntitlement(supabase, 'user-1', 'career_ai')).toBe(false);
    });
});

describe('hasFeatureEntitlement', () => {
    it('grants a plan-included feature from subscription_cache', async () => {
        const supabase = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'professional', features: ['analytics'], synced_at: FRESH },
        });
        expect(await hasFeatureEntitlement(supabase, 'user-1', 'analytics')).toBe(true);
    });

    it('grants a freemium baseline feature even without a paid plan', async () => {
        const supabase = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'freemium', features: [], synced_at: FRESH },
        });
        expect(await hasFeatureEntitlement(supabase, 'user-1', 'dashboard_access')).toBe(true);
    });

    it('falls back to an add-on entitlement when the plan does not include the feature', async () => {
        const supabase = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'freemium', features: [], synced_at: FRESH },
            addon: { id: 'ent-2' }, // purchased add-on grants it
        });
        expect(await hasFeatureEntitlement(supabase, 'user-1', 'career_ai')).toBe(true);
    });

    it('denies when neither the plan nor an add-on grants the feature', async () => {
        const supabase = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'freemium', features: [], synced_at: FRESH },
            addon: null,
        });
        expect(await hasFeatureEntitlement(supabase, 'user-1', 'mock_interviews')).toBe(false);
    });

    it('fails closed when there is no active subscription and no add-on', async () => {
        const supabase = makeSupabaseMock({ subscription: null, addon: null });
        expect(await hasFeatureEntitlement(supabase, 'user-1', 'analytics')).toBe(false);
    });
});

describe('hasAnyFeature', () => {
    it('grants when ANY of the keys resolves', async () => {
        const supabase = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'professional', features: ['analytics'], synced_at: FRESH },
        });
        expect(await hasAnyFeature(supabase, 'user-1', ['missing_one', 'analytics'])).toBe(true);
    });

    it('denies when none of the keys resolve', async () => {
        const supabase = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'freemium', features: [], synced_at: FRESH },
            addon: null,
        });
        expect(await hasAnyFeature(supabase, 'user-1', ['analytics', 'mock_interviews'])).toBe(false);
    });

    it('fails closed on a missing user id', async () => {
        const supabase = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'professional', features: ['analytics'], synced_at: FRESH },
        });
        expect(await hasAnyFeature(supabase, '', ['analytics'])).toBe(false);
        expect(await hasAnyFeature(supabase, null, ['analytics'])).toBe(false);
        expect(await hasAnyFeature(supabase, undefined, ['analytics'])).toBe(false);
    });

    it('fails closed on an empty or invalid key set', async () => {
        const supabase = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'professional', features: ['analytics'], synced_at: FRESH },
        });
        expect(await hasAnyFeature(supabase, 'user-1', [])).toBe(false);
        expect(await hasAnyFeature(supabase, 'user-1', ['', ''])).toBe(false);
        expect(await hasAnyFeature(supabase, 'user-1', undefined as unknown as string[])).toBe(false);
    });
});
