import { describe, it, expect, vi, beforeEach } from 'vitest';

// Minimal mock for Supabase client
const VALID_UUID = '59dc759d-45ff-4d14-b7f3-34c435cbf4ae';
function mockSupabase(overrides: any = {}) {
  const from = vi.fn((table: string) => {
    if (table === 'learners' && overrides.learnersExists) {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'l1' } }) }), limit: () => ({ maybeSingle: async () => ({ data: { id: 'l1' } }) }) }) } as any;
    }
    if (table === 'users' && overrides.usersExists) {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'u1' } }) }) }) } as any;
    }
    if (table === 'organization_members' && overrides.membersExists) {
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'm1' } }), limit: () => ({ maybeSingle: async () => ({ data: { id: 'm1' } }) }) }) }) } as any;
    }
    if (table === 'organization_members') {
      // default miss for members
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }), limit: () => ({ maybeSingle: async () => ({ data: null }) }) }), limit: () => ({ maybeSingle: async () => ({ data: null }) }) }), upsert: async () => ({ error: null }) } as any;
    }
    // default: miss
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      limit: () => chain,
      maybeSingle: async () => ({ data: null }),
      upsert: async () => ({ error: null }),
    };
    if (overrides.fromImpl) return overrides.fromImpl(table);
    return chain;
  });
  return { from } as any;
}

describe('heal-user', () => {
  beforeEach(() => vi.resetModules());

  it('should return already_exists when learners and users exist', async () => {
    const { ensureAppUserAndLearner } = await import('../heal-user');
    const supabase = mockSupabase({ learnersExists: true, usersExists: true, membersExists: true });
    const env: any = {
      SSO_SERVICE: {
        getUserById: async () => ({ id: VALID_UUID, email: 'a@b.com', user_metadata: {}, is_blocked: false }),
        getUserMemberships: async () => ({ memberships: [{ id: 'm1', org_id: 'org1', role: 'learner', status: 'active' }] }),
        getOrganizationById: async () => ({ id: 'org1', name: 'Test Org', metadata: { organization_type: 'college' } }),
        syncSubscription: async () => ({ subscription: { id: 'sub1', user_id: VALID_UUID, plan_code: 'premium', status: 'active' }, plan: { id: 'plan1', name: 'Premium' } }),
      },
    };
    // Mock subscription_cache to exist so full parity early-exit triggers already_exists
    const originalFrom = supabase.from;
    supabase.from = vi.fn((table: string) => {
      if (table === 'subscription_cache') {
        return { select: () => ({ eq: () => ({ limit: () => ({ maybeSingle: async () => ({ data: { id: 'sub1' } }) }) }) }), upsert: async () => ({ error: null }) } as any;
      }
      return (originalFrom as any)(table);
    }) as any;
    const res = await ensureAppUserAndLearner(supabase, env, { sub: VALID_UUID, email: 'a@b.com' });
    expect(res.healed).toBe(false);
    expect(res.reason).toBe('already_exists');
  });

  it('should fail-soft when SSO_SERVICE missing', async () => {
    const { ensureAppUserAndLearner } = await import('../heal-user');
    const supabase = mockSupabase();
    const res = await ensureAppUserAndLearner(supabase, {} as any, { sub: VALID_UUID, email: 'a@b.com' });
    expect(res.healed).toBe(false);
    expect(res.reason).toBe('no_binding');
  });

  it('should heal via SSO RPCs with resilience', async () => {
    const { ensureAppUserAndLearner } = await import('../heal-user');
    let upsertCalls = 0;
    const mkChain = (maybeData: any, hasUpsert = true) => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => ({ data: maybeData }),
      };
      if (hasUpsert) chain.upsert = async () => { upsertCalls++; return { error: null }; };
      chain.insert = async () => { upsertCalls++; return { error: null }; };
      return chain;
    };
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'learners' && upsertCalls === 0) {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }), upsert: async () => { upsertCalls++; return { error: null }; }, insert: async () => { upsertCalls++; return { error: null }; } } as any;
        }
        if (table === 'users') {
          return mkChain(null);
        }
        if (table === 'learners') {
          return mkChain(upsertCalls > 0 ? { id: 'healed' } : null);
        }
        if (table === 'organizations') {
          return mkChain(null);
        }
        if (table === 'users_shadow') {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }), insert: async () => { upsertCalls++; return { error: null }; }, upsert: async () => { upsertCalls++; return { error: null }; } } as any;
        }
        if (table === 'subscription_cache') {
          return mkChain(null);
        }
        return mkChain(null);
      }),
    } as any;

    const env: any = {
      SSO_SERVICE: {
        getUserById: async () => ({ id: VALID_UUID, email: 'a@b.com', user_metadata: { firstName: 'A', lastName: 'B' }, is_blocked: false }),
        getUserMemberships: async () => ({ memberships: [{ id: 'm1', org_id: 'org1', role: 'learner', status: 'active' }] }),
        getOrganizationById: async () => ({ id: 'org1', name: 'Test Org', metadata: { organization_type: 'college' } }),
        syncSubscription: async () => ({ subscription: { id: 'sub1', user_id: VALID_UUID, plan_code: 'premium', status: 'active' }, plan: { id: 'plan1', name: 'Premium' } }),
      },
    };
    const res = await ensureAppUserAndLearner(supabase, env, { sub: VALID_UUID, email: 'a@b.com' });
    expect(res.healed).toBe(true);
  });

  it('should handle SSO failure fail-soft', async () => {
    const { ensureAppUserAndLearner } = await import('../heal-user');
    const supabase = mockSupabase();
    const env: any = { SSO_SERVICE: { getUserById: async () => { throw new Error('SSO down'); } } };
    const res = await ensureAppUserAndLearner(supabase, env, { sub: VALID_UUID, email: 'a@b.com' });
    expect(res.healed).toBe(false);
  });
});
