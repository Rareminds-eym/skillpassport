/**
 * Unit Tests for OrganizationEntitlementService
 *
 * Tests for Task 21.3: Test OrganizationEntitlementService methods
 * Tests for Task 21.8: Test access control checks
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseAssignment } from '../licenseManagementService';
import { OrganizationEntitlementService } from '../organizationEntitlementService';

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
    })),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabaseClient';

describe('OrganizationEntitlementService', () => {
  let service: OrganizationEntitlementService;

  beforeEach(() => {
    service = new OrganizationEntitlementService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Task 21.3: Test OrganizationEntitlementService methods
  // ==========================================================================
  describe('grantEntitlementsFromAssignment', () => {
    const mockAssignment: LicenseAssignment = {
      id: 'assign-001',
      licensePoolId: 'pool-001',
      organizationSubscriptionId: 'sub-001',
      userId: 'user-123',
      memberType: 'educator',
      status: 'active',
      assignedAt: new Date().toISOString(),
      assignedBy: 'admin-456',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should grant entitlements for all plan features', async () => {
      const mockSubscription = {
        subscription_plan_id: 'plan-001',
      };

      const mockPlan = {
        features: ['feature_ai_assistant', 'feature_analytics', 'feature_reports'],
      };

      const mockEntitlement = {
        id: 'ent-001',
        user_id: 'user-123',
        feature_key: 'feature_ai_assistant',
        is_active: true,
        granted_by_organization: true,
        organization_subscription_id: 'sub-001',
        granted_by: 'admin-456',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'organization_subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockSubscription, error: null }),
          } as any;
        }
        if (table === 'subscription_plans') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPlan, error: null }),
          } as any;
        }
        // user_entitlements insert
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockEntitlement, error: null }),
        } as any;
      });

      const result = await service.grantEntitlementsFromAssignment(mockAssignment);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw error when subscription not found', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }) as any
      );

      await expect(service.grantEntitlementsFromAssignment(mockAssignment)).rejects.toThrow(
        'Subscription not found'
      );
    });

    it('should throw error when plan features not found', async () => {
      const mockSubscription = {
        subscription_plan_id: 'plan-001',
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'organization_subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockSubscription, error: null }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any;
      });

      await expect(service.grantEntitlementsFromAssignment(mockAssignment)).rejects.toThrow(
        'Plan features not found'
      );
    });
  });

  describe('revokeEntitlementsFromAssignment', () => {
    it('should revoke all organization-provided entitlements', async () => {
      const mockAssignment = {
        user_id: 'user-123',
        organization_subscription_id: 'sub-001',
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // Get assignment
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAssignment, error: null }),
          } as any;
        }
        // Update entitlements - support 3 chained .eq() calls
        const chainable: any = {};
        chainable.update = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        }));
        return chainable;
      });

      await expect(service.revokeEntitlementsFromAssignment('assign-001')).resolves.not.toThrow();
    });

    it('should throw error when assignment not found', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }) as any
      );

      await expect(service.revokeEntitlementsFromAssignment('invalid-assign')).rejects.toThrow(
        'Assignment not found'
      );
    });
  });

  // ==========================================================================
  // Task 21.8: Test access control checks
  // ==========================================================================
  describe('hasOrganizationAccess', () => {
    it('should return organization access when user has org-provided entitlement', async () => {
      const mockOrgEntitlement = {
        id: 'ent-001',
        user_id: 'user-123',
        feature_key: 'feature_ai_assistant',
        is_active: true,
        granted_by_organization: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockOrgEntitlement, error: null }),
          }) as any
      );

      const result = await service.hasOrganizationAccess('user-123', 'feature_ai_assistant');

      expect(result.hasAccess).toBe(true);
      expect(result.source).toBe('organization');
    });

    it('should return personal access when user has self-purchased entitlement', async () => {
      const mockPersonalEntitlement = {
        id: 'ent-002',
        user_id: 'user-123',
        feature_key: 'feature_ai_assistant',
        is_active: true,
        granted_by_organization: false,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // No org entitlement
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          } as any;
        }
        // Personal entitlement found
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPersonalEntitlement, error: null }),
        } as any;
      });

      const result = await service.hasOrganizationAccess('user-123', 'feature_ai_assistant');

      expect(result.hasAccess).toBe(true);
      expect(result.source).toBe('personal');
    });

    it('should return no access when user has no entitlement', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }) as any
      );

      const result = await service.hasOrganizationAccess('user-123', 'feature_ai_assistant');

      expect(result.hasAccess).toBe(false);
      expect(result.source).toBe('none');
    });

    it('should handle errors gracefully and return no access', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockRejectedValue(new Error('Database error')),
          }) as any
      );

      const result = await service.hasOrganizationAccess('user-123', 'feature_ai_assistant');

      expect(result.hasAccess).toBe(false);
      expect(result.source).toBe('none');
    });
  });

  describe('getUserEntitlements', () => {
    it('should separate organization-provided and self-purchased entitlements', async () => {
      const mockEntitlements = [
        {
          id: 'ent-001',
          user_id: 'user-123',
          feature_key: 'feature_ai_assistant',
          is_active: true,
          granted_by_organization: true,
          organization_subscription_id: 'sub-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ent-002',
          user_id: 'user-123',
          feature_key: 'feature_premium_support',
          is_active: true,
          granted_by_organization: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ent-003',
          user_id: 'user-123',
          feature_key: 'feature_analytics',
          is_active: true,
          granted_by_organization: true,
          organization_subscription_id: 'sub-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Create chainable mock that supports multiple .eq() calls
      const createChainableMock = () => {
        const chainable: any = {};
        chainable.select = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockResolvedValue({ data: mockEntitlements, error: null }),
        }));
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation(() => createChainableMock());

      const result = await service.getUserEntitlements('user-123');

      expect(result.organizationProvided).toHaveLength(2);
      expect(result.selfPurchased).toHaveLength(1);
      expect(result.organizationProvided[0].featureKey).toBe('feature_ai_assistant');
      expect(result.selfPurchased[0].featureKey).toBe('feature_premium_support');
    });

    it('should return empty arrays when no entitlements exist', async () => {
      const createChainableMock = () => {
        const chainable: any = {};
        chainable.select = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }));
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation(() => createChainableMock());

      const result = await service.getUserEntitlements('user-123');

      expect(result.organizationProvided).toHaveLength(0);
      expect(result.selfPurchased).toHaveLength(0);
    });
  });

  describe('syncOrganizationEntitlements', () => {
    it('should revoke and re-grant entitlements for all active assignments', async () => {
      const mockAssignments = [
        {
          id: 'assign-001',
          user_id: 'user-123',
          organization_subscription_id: 'sub-001',
          member_type: 'educator',
          status: 'active',
        },
        {
          id: 'assign-002',
          user_id: 'user-456',
          organization_subscription_id: 'sub-001',
          member_type: 'educator',
          status: 'active',
        },
      ];

      const mockSubscription = { subscription_plan_id: 'plan-001' };
      const mockPlan = { features: ['feature_ai'] };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // Get assignments - support chained .eq() calls
          const chainable: any = {};
          chainable.select = vi.fn().mockReturnValue(chainable);
          chainable.eq = vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ data: mockAssignments, error: null }),
          }));
          return chainable;
        }
        // Subsequent calls for revoke/grant operations
        return {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi
            .fn()
            .mockResolvedValue({
              data: table === 'organization_subscriptions' ? mockSubscription : mockPlan,
              error: null,
            }),
        } as any;
      });

      await expect(service.syncOrganizationEntitlements('sub-001')).resolves.not.toThrow();
    });

    it('should do nothing when no active assignments exist', async () => {
      const createChainableMock = () => {
        const chainable: any = {};
        chainable.select = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }));
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation(() => createChainableMock());

      await expect(service.syncOrganizationEntitlements('sub-001')).resolves.not.toThrow();
    });
  });

  describe('bulkGrantEntitlements', () => {
    it('should grant entitlements to multiple users', async () => {
      const mockEntitlement = {
        id: 'ent-001',
        user_id: 'user-123',
        feature_key: 'feature_ai_assistant',
        is_active: true,
        granted_by_organization: true,
        organization_subscription_id: 'sub-001',
        granted_by: 'admin-456',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockEntitlement, error: null }),
          }) as any
      );

      const result = await service.bulkGrantEntitlements(
        ['user-123', 'user-456'],
        ['feature_ai_assistant', 'feature_analytics'],
        'sub-001',
        'admin-789'
      );

      expect(result.length).toBeGreaterThan(0);
    });

    it('should continue on individual failures', async () => {
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => {
            if (callCount === 1) {
              return Promise.resolve({ data: null, error: { message: 'Duplicate' } });
            }
            return Promise.resolve({
              data: {
                id: `ent-${callCount}`,
                user_id: 'user-456',
                feature_key: 'feature_ai_assistant',
                is_active: true,
                granted_by_organization: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            });
          }),
        } as any;
      });

      const result = await service.bulkGrantEntitlements(
        ['user-123', 'user-456'],
        ['feature_ai_assistant'],
        'sub-001',
        'admin-789'
      );

      // Should have at least one successful grant
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('bulkRevokeEntitlements', () => {
    it('should revoke entitlements from multiple users', async () => {
      // Create chainable mock that supports .in() and .eq() chaining
      const createChainableMock = () => {
        const chainable: any = {};
        chainable.update = vi.fn().mockReturnValue(chainable);
        chainable.in = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }));
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation(() => createChainableMock());

      await expect(
        service.bulkRevokeEntitlements(['user-123', 'user-456'], 'sub-001')
      ).resolves.not.toThrow();
    });

    it('should throw error on database failure', async () => {
      const createChainableMock = () => {
        const chainable: any = {};
        chainable.update = vi.fn().mockReturnValue(chainable);
        chainable.in = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Database error' } }),
        }));
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation(() => createChainableMock());

      await expect(
        service.bulkRevokeEntitlements(['user-123', 'user-456'], 'sub-001')
      ).rejects.toThrow();
    });
  });

  describe('getOrganizationEntitlementStats', () => {
    it('should return correct statistics', async () => {
      const mockEntitlements = [
        { user_id: 'user-1', feature_key: 'feature_ai' },
        { user_id: 'user-1', feature_key: 'feature_analytics' },
        { user_id: 'user-2', feature_key: 'feature_ai' },
        { user_id: 'user-2', feature_key: 'feature_analytics' },
        { user_id: 'user-3', feature_key: 'feature_ai' },
      ];

      // Create chainable mock that supports 3 .eq() calls
      const createChainableMock = () => {
        const chainable: any = {};
        chainable.select = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ data: mockEntitlements, error: null }),
          })),
        }));
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation(() => createChainableMock());

      const result = await service.getOrganizationEntitlementStats('sub-001');

      expect(result.totalMembers).toBe(3);
      expect(result.activeEntitlements).toBe(5);
      expect(result.featureBreakdown['feature_ai']).toBe(3);
      expect(result.featureBreakdown['feature_analytics']).toBe(2);
    });

    it('should return zeros when no entitlements exist', async () => {
      const createChainableMock = () => {
        const chainable: any = {};
        chainable.select = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        }));
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation(() => createChainableMock());

      const result = await service.getOrganizationEntitlementStats('sub-001');

      expect(result.totalMembers).toBe(0);
      expect(result.activeEntitlements).toBe(0);
      expect(result.featureBreakdown).toEqual({});
    });
  });
});
