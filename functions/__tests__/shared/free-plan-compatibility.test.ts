// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
vi.mock('../../../src/shared/lib/error-logging', () => ({ createFeatureAccessErrorLog: vi.fn(), logError: vi.fn() }));
import { checkFeatureAccess } from '../../../src/features/subscription/lib/featureGating';
import { isFreemiumPlan } from '../../../src/shared/lib/isFreemiumPlan';
import { checkServerFeatureAccess } from '../../shared/lib/server-feature-gating';
import type { SupabaseClient } from '@supabase/supabase-js';

describe.each(['freemium', 'discover'])('%s free-tier compatibility', plan => {
  it('keeps existing free browsing available', () => {
    for (const feature of ['dashboard_access', 'profile_creation', 'marketplace_access', 'courses_listing_access', 'opportunities_listing_access']) {
      expect(checkFeatureAccess(plan, feature).hasAccess).toBe(true);
    }
  });
  it('uses existing premium locks and upgrade prompts', () => {
    for (const feature of ['opportunities_access', 'portfolio', 'analytics', 'course_enrollment', 'career_paths', 'priority_support', 'assessments']) {
      expect(checkFeatureAccess(plan, feature)).toMatchObject({ hasAccess: false, upgradeRequired: true });
    }
    expect(checkFeatureAccess(plan, 'unknown_feature').hasAccess).toBe(false);
  });
  it('keeps server-side free locks even when a cached feature list contains premium keys', async () => {
    const query: any = { select: () => query, eq: () => query, in: () => query,
      maybeSingle: async () => ({ data: { plan_code: plan, status: 'active', features: ['analytics', 'portfolio'], synced_at: new Date().toISOString() }, error: null }) };
    const db = { from: () => query } as unknown as SupabaseClient;
    expect((await checkServerFeatureAccess(db, 'user', 'analytics')).hasAccess).toBe(false);
    expect((await checkServerFeatureAccess(db, 'user', 'portfolio')).hasAccess).toBe(false);
    expect((await checkServerFeatureAccess(db, 'user', 'dashboard_access')).hasAccess).toBe(true);
  });
});

it.each(['basic', 'professional', 'premium', 'enterprise', 'hybrid'])('preserves existing paid/other plan checks for %s', plan => {
  expect(isFreemiumPlan(plan)).toBe(false);
  expect(checkFeatureAccess(plan, 'analytics').hasAccess).toBe(true);
});

it('recognizes both codes without rewriting them or treating a missing plan as free', () => {
  expect(isFreemiumPlan(' Freemium ')).toBe(true);
  expect(isFreemiumPlan('Discover')).toBe(true);
  expect(isFreemiumPlan(null)).toBe(false);
});
