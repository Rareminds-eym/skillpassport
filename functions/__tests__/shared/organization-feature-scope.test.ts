// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('../../shared/lib/entitlement-service', () => ({
  checkEntitlement: vi.fn(async () => ({ allowed: false, reason: 'not recognized' })),
}));

import { checkServerFeatureAccess } from '../../shared/lib/server-feature-gating';

function database(organizationSubscription: boolean): SupabaseClient {
  const tables: Record<string, Record<string, unknown>[]> = {
    subscription_cache: [
      { id: 'own', user_id: 'learner', organization_id: 'org', plan_code: 'freemium',
        status: 'active', is_organization_subscription: false, created_at: '2026-01-01', features: [] },
      { id: 'other', user_id: 'buyer', organization_id: 'org', plan_code: 'professional',
        status: 'active', is_organization_subscription: organizationSubscription,
        created_at: '2026-10-01', synced_at: new Date().toISOString(), features: ['ai_job_matching'] },
    ],
    organization_members: [{ user_id: 'learner', organization_id: 'org', status: 'active' }],
  };
  return { from(table: string) {
    let rows = [...(tables[table] || [])];
    const query = {
      select() { return query; },
      eq(column: string, value: unknown) { rows = rows.filter(row => row[column] === value); return query; },
      in(column: string, values: unknown[]) { rows = rows.filter(row => values.includes(row[column])); return query; },
      order(column: string) { rows.sort((a, b) => String(b[column]).localeCompare(String(a[column]))); return query; },
      limit(count: number) { rows = rows.slice(0, count); return query; },
      async maybeSingle() { return { data: rows[0] || null, error: null }; },
    };
    return query;
  } } as unknown as SupabaseClient;
}

describe('organization feature access', () => {
  it('does not borrow another member’s personal subscription', async () => {
    const result = await checkServerFeatureAccess(database(false), 'learner', 'ai_job_matching');
    expect(result.hasAccess).toBe(false);
    expect(result.planCode).toBe('freemium');
  });

  it('preserves coverage from an organization subscription', async () => {
    const result = await checkServerFeatureAccess(database(true), 'learner', 'ai_job_matching');
    expect(result.hasAccess).toBe(true);
    expect(result.planCode).toBe('professional');
  });
});
