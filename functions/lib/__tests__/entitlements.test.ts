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
import { checkServerFeatureAccess } from '../../shared/lib/server-feature-gating';

/**
 * Builds a Supabase mock that serves:
 *  - `subscription_cache` SELECT → { data: subscription, error }
 *  - `user_entitlements`  SELECT → { data: addonRow, error } (filtered builder)
 *
 * The builder ignores filter args (eq/in/limit) and resolves `.maybeSingle()`
 * to the configured result for the requested table.
 */
interface AddonRecord {
    id: string;
    feature_key?: string;
    status: string;
    end_date?: string | null;
}

function makeSupabaseMock(opts: {
    subscription?: { status: string; plan_code: string; features: string[]; synced_at?: string; subscription_end_date?: string } | null;
    subscriptionError?: { message: string } | null;
    addon?: AddonRecord | null;
    addons?: AddonRecord[];
    addonError?: { message: string; code?: string } | null;
} = {}): SupabaseClient {
    const builder = (table: string) => {
        let selectedCols = '*';
        let orFilter: string | null = null;
        let inStatus: string[] = [];
        let eqFeature: string | null = null;

        const chain: any = {
            _table: table,
            select(cols: string = '*') {
                selectedCols = cols;
                return chain;
            },
            eq(col: string, val: any) {
                if (col === 'feature_key') eqFeature = val;
                return chain;
            },
            in(col: string, vals: any[]) {
                if (col === 'status') inStatus = vals;
                return chain;
            },
            gt() { return chain; },
            gte() { return chain; },
            or(filter: string) {
                orFilter = filter;
                return chain;
            },
            order() { return chain; },
            limit() { return chain; },
            single() { return chain.maybeSingle(); },
            maybeSingle() {
                if (table === 'subscription_cache') {
                    return Promise.resolve({
                        data: opts.subscription ?? null,
                        error: opts.subscriptionError ?? null,
                    });
                }
                if (table === 'user_entitlements') {
                    // Fail if caller attempts to select nonexistent expires_at column
                    if (selectedCols.includes('expires_at')) {
                        return Promise.resolve({
                            data: null,
                            error: { message: 'column "expires_at" does not exist', code: '42703' },
                        });
                    }

                    if (opts.addonError) {
                        return Promise.resolve({ data: null, error: opts.addonError });
                    }

                    const rows = opts.addons ?? (opts.addon ? [opts.addon] : []);
                    const nowIso = new Date().toISOString();
                    const matching = rows.filter((a) => {
                        if (eqFeature && a.feature_key && a.feature_key !== eqFeature) return false;
                        if (inStatus.length > 0 && a.status && !inStatus.includes(a.status)) return false;
                        if (orFilter && orFilter.includes('end_date.gte')) {
                            if (a.end_date && a.end_date < nowIso) return false;
                        }
                        return true;
                    });
                    return Promise.resolve({ data: matching[0] ?? null, error: null });
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

    it('grants when a cancelled add-on has future expiration date', async () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        const supabase = makeSupabaseMock({ addon: { id: 'ent-1', status: 'cancelled', end_date: futureDate } as any });
        expect(await hasActiveAddonEntitlement(supabase, 'user-1', 'career_ai')).toBe(true);
    });

    it('denies when an add-on expiration date has passed', async () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString();
        const supabase = makeSupabaseMock({ addon: { id: 'ent-1', status: 'cancelled', end_date: pastDate } as any });
        expect(await hasActiveAddonEntitlement(supabase, 'user-1', 'career_ai')).toBe(false);
    });

    it('recovers valid purchase when user has both expired and active add-on grants', async () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString();
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        const supabase = makeSupabaseMock({
            addons: [
                { id: 'old-expired', feature_key: 'career_ai', status: 'cancelled', end_date: pastDate },
                { id: 'new-valid', feature_key: 'career_ai', status: 'active', end_date: futureDate },
            ],
        });
        expect(await hasActiveAddonEntitlement(supabase, 'user-1', 'career_ai')).toBe(true);
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

    it('grants access for unexpired cancelled personal subscription', async () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        const supabase = makeSupabaseMock({
            subscription: {
                status: 'cancelled',
                plan_code: 'professional',
                features: ['career_ai'],
                subscription_end_date: futureDate,
            },
        });
        expect(await hasFeatureEntitlement(supabase, 'user-1', 'career_ai')).toBe(true);
    });

    it('denies access for expired cancelled personal subscription', async () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString();
        const supabase = makeSupabaseMock({
            subscription: {
                status: 'cancelled',
                plan_code: 'professional',
                features: ['career_ai'],
                subscription_end_date: pastDate,
            },
        });
        expect(await hasFeatureEntitlement(supabase, 'user-1', 'career_ai')).toBe(false);
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
            addon: { id: 'ent-2', status: 'active' }, // purchased add-on grants it
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

describe('UI/API Access Agreement', () => {
    it('agrees on unexpired cancelled subscription (both grant access)', async () => {
        const futureDate = new Date(Date.now() + 86400000).toISOString();
        const supabase = makeSupabaseMock({
            subscription: {
                status: 'cancelled',
                plan_code: 'professional',
                features: ['career_ai'],
                subscription_end_date: futureDate,
            },
        });
        const planAccess = await checkServerFeatureAccess(supabase, 'user-1', 'career_ai');
        const apiAccess = await hasFeatureEntitlement(supabase, 'user-1', 'career_ai');
        expect(planAccess.hasAccess).toBe(true);
        expect(apiAccess).toBe(true);
    });

    it('agrees on expired cancelled subscription (both deny access)', async () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString();
        const supabase = makeSupabaseMock({
            subscription: {
                status: 'cancelled',
                plan_code: 'professional',
                features: ['career_ai'],
                subscription_end_date: pastDate,
            },
        });
        const planAccess = await checkServerFeatureAccess(supabase, 'user-1', 'career_ai');
        const apiAccess = await hasFeatureEntitlement(supabase, 'user-1', 'career_ai');
        expect(planAccess.hasAccess).toBe(false);
        expect(apiAccess).toBe(false);
    });

    it('agrees on add-on access when plan does not include the feature', async () => {
        const supabase = makeSupabaseMock({
            subscription: { status: 'active', plan_code: 'freemium', features: [] },
            addon: { id: 'ent-1', status: 'active' },
        });
        const addonAccess = await hasActiveAddonEntitlement(supabase, 'user-1', 'career_ai');
        const apiAccess = await hasFeatureEntitlement(supabase, 'user-1', 'career_ai');
        expect(addonAccess).toBe(true);
        expect(apiAccess).toBe(true);
    });
});

