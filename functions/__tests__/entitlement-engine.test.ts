import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  comparePlanTiers, 
  getTenantEntitlements, 
  checkEntitlement,
  type EntitlementManifest 
} from '../shared/lib/entitlement-service';
import { canUpgradeToPlan } from '../shared/lib/server-feature-gating';

describe('Entitlement Engine — Unit Test Suite', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('comparePlanTiers (Dynamic Database Comparison)', () => {
    it('returns "equal" when plan codes are identical', async () => {
      mockSupabase = {};
      const result = await comparePlanTiers(mockSupabase, 'recruiter_growth', 'recruiter_growth');
      expect(result).toBe('equal');
    });

    it('correctly compares recruiter_lite vs recruiter_growth as "lower"', async () => {
      mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                { plan_code: 'recruiter_lite', hierarchy_order: 1, display_order: 20 },
                { plan_code: 'recruiter_growth', hierarchy_order: 3, display_order: 40 },
              ],
            }),
          }),
        }),
      };

      const result = await comparePlanTiers(mockSupabase, 'recruiter_lite', 'recruiter_growth');
      expect(result).toBe('lower');
    });

    it('correctly compares recruiter_pro vs recruiter_starter as "higher"', async () => {
      mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                { plan_code: 'recruiter_pro', hierarchy_order: 4, display_order: 50 },
                { plan_code: 'recruiter_starter', hierarchy_order: 2, display_order: 30 },
              ],
            }),
          }),
        }),
      };

      const result = await comparePlanTiers(mockSupabase, 'recruiter_pro', 'recruiter_starter');
      expect(result).toBe('higher');
    });
  });

  describe('canUpgradeToPlan', () => {
    it('allows upgrade from recruiter_lite to recruiter_growth without "Invalid plan code" error', async () => {
      mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'subscription_cache') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: { id: 'sub-1', status: 'active', plan_code: 'recruiter_lite' },
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'plans_cache') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [
                    { plan_code: 'recruiter_lite', hierarchy_order: 1, display_order: 20 },
                    { plan_code: 'recruiter_growth', hierarchy_order: 3, display_order: 40 },
                  ],
                }),
              }),
            };
          }
          return { select: vi.fn() };
        }),
      };

      const result = await canUpgradeToPlan(mockSupabase, 'usr-123', 'recruiter_growth');
      expect(result.canUpgrade).toBe(true);
      expect(result.currentPlanCode).toBe('recruiter_lite');
    });

    it('blocks downgrade from recruiter_growth to recruiter_lite', async () => {
      mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'subscription_cache') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: { id: 'sub-1', status: 'active', plan_code: 'recruiter_growth' },
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'plans_cache') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [
                    { plan_code: 'recruiter_growth', hierarchy_order: 3, display_order: 40 },
                    { plan_code: 'recruiter_lite', hierarchy_order: 1, display_order: 20 },
                  ],
                }),
              }),
            };
          }
          return { select: vi.fn() };
        }),
      };

      const result = await canUpgradeToPlan(mockSupabase, 'usr-123', 'recruiter_lite');
      expect(result.canUpgrade).toBe(false);
      expect(result.reason).toContain('Cannot downgrade');
    });
  });

  describe('getTenantEntitlements', () => {
    it('resolves active recruiter subscription and gathers entitlements with credit balance', async () => {
      const tenantId = 'org-777';

      mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'subscription_cache') {
            return {
              select: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: {
                            id: 'sub-growth-1',
                            plan_id: 'plan-growth-uuid',
                            plan_code: 'recruiter_growth',
                            status: 'active',
                          },
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'plans_cache') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'plan-growth-uuid',
                      plan_code: 'recruiter_growth',
                      name: 'Recruiter Growth',
                      plan_family: 'recruiter',
                      hierarchy_order: 3,
                      entity_config: { recruitment: { purchase_mode: 'self_serve' } },
                    },
                  }),
                }),
              }),
            };
          }
          if (table === 'features') {
            return {
              select: vi.fn().mockResolvedValue({
                data: [
                  { id: 'f1', feature_key: 'active_job_posts', display_name: 'Active Job Posts', feature_type: 'numeric_limit', category: 'hiring' },
                  { id: 'f2', feature_key: 'contact_unlocks', display_name: 'Contact Unlocks', feature_type: 'metered', category: 'credits' },
                  { id: 'f3', feature_key: 'ai_candidate_recommendations', display_name: 'AI Recommendations', feature_type: 'boolean', category: 'ai' },
                ],
              }),
            };
          }
          if (table === 'plan_entitlements') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [
                    { plan_id: 'plan-growth-uuid', feature_id: 'f1', is_enabled: true, value_numeric: 15 },
                    { plan_id: 'plan-growth-uuid', feature_id: 'f2', is_enabled: true, value_numeric: 200 },
                    { plan_id: 'plan-growth-uuid', feature_id: 'f3', is_enabled: true },
                  ],
                }),
              }),
            };
          }
          if (table === 'tenant_entitlement_overrides') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [] }),
              }),
            };
          }
          if (table === 'opportunities') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ count: 4 }),
                  or: vi.fn().mockResolvedValue({ count: 4 }),
                }),
              }),
            };
          }
          return { select: vi.fn() };
        }),
        rpc: vi.fn((proc: string) => {
          if (proc === 'get_credit_balance') {
            return Promise.resolve({
              data: [{ allocated: 200, consumed: 45, remaining: 155 }],
            });
          }
          return Promise.resolve({ data: null });
        }),
      };

      const manifest: EntitlementManifest = await getTenantEntitlements(mockSupabase, tenantId, 'recruiter');

      expect(manifest.tenant_id).toBe(tenantId);
      expect(manifest.plan_code).toBe('recruiter_growth');
      expect(manifest.hierarchy_order).toBe(3);
      expect(manifest.is_subscribed).toBe(true);

      // Check numeric limit feature
      expect(manifest.features['active_job_posts']).toBeDefined();
      expect(manifest.features['active_job_posts'].enabled).toBe(true);
      expect(manifest.features['active_job_posts'].limit).toBe(15);
      expect(manifest.features['active_job_posts'].current_usage).toBe(4);

      // Check metered feature
      expect(manifest.features['contact_unlocks']).toBeDefined();
      expect(manifest.features['contact_unlocks'].feature_type).toBe('metered');
      expect(manifest.features['contact_unlocks'].allocated).toBe(200);
      expect(manifest.features['contact_unlocks'].consumed).toBe(45);
      expect(manifest.features['contact_unlocks'].remaining).toBe(155);

      // Check boolean feature
      expect(manifest.features['ai_candidate_recommendations'].enabled).toBe(true);
    });

    it('falls back to recruiter_free when tenant has no active subscription', async () => {
      const tenantId = 'new-user-1';

      mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'subscription_cache') {
            return {
              select: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'plans_cache') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'plan-free-uuid',
                      plan_code: 'recruiter_free',
                      name: 'Recruiter Free',
                      plan_family: 'recruiter',
                      hierarchy_order: 0,
                    },
                  }),
                }),
              }),
            };
          }
          if (table === 'features') {
            return {
              select: vi.fn().mockResolvedValue({ data: [] }),
            };
          }
          if (table === 'plan_entitlements') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [] }),
              }),
            };
          }
          if (table === 'tenant_entitlement_overrides') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [] }),
              }),
            };
          }
          return { select: vi.fn() };
        }),
      };

      const manifest = await getTenantEntitlements(mockSupabase, tenantId, 'recruiter');
      expect(manifest.is_subscribed).toBe(false);
      expect(manifest.plan_code).toBe('recruiter_free');
      expect(manifest.hierarchy_order).toBe(0);
    });
  });
});
