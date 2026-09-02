/**
 * Unit Tests for OrganizationEntitlementService
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseAssignment } from '../licenseManagementService';
import { OrganizationEntitlementService } from '../organizationEntitlementService';

// Mock SSO client
vi.mock('@/shared/api/ssoClient', () => ({
  ssoClient: {
    fetch: vi.fn(),
    getAccessToken: vi.fn(() => 'test-token')
  }
}));

import { ssoClient } from '@/shared/api/ssoClient';

function createMockResponse<T>(data: T, status = 200, ok = true): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers(),
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: function () { return this; },
    body: null,
    bodyUsed: false,
    type: 'basic',
    url: '',
  } as Response;
}

describe('OrganizationEntitlementService', () => {
  let service: OrganizationEntitlementService;

  beforeEach(() => {
    service = new OrganizationEntitlementService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

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
      updatedAt: new Date().toISOString()
    };

    it('should grant entitlements for all plan features', async () => {
      const mockPlan = {
        features: ['feature_ai_assistant', 'feature_analytics']
      };

      vi.mocked(ssoClient.fetch).mockImplementation(async (url: string, init?: RequestInit) => {
        if (typeof url === 'string' && url.includes('getPlansCache')) {
          return createMockResponse({ data: mockPlan });
        }
        const body = JSON.parse(String(init?.body || '{}'));
        return createMockResponse({
          data: {
            id: 'ent-001',
            user_id: body.userId,
            feature_key: body.featureKey,
            is_active: true,
            granted_by_organization: true,
            organization_subscription_id: body.organizationSubscriptionId,
            granted_by: body.grantedBy,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
      });

      const result = await service.grantEntitlementsFromAssignment(mockAssignment);

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(result[0].featureKey).toBe('feature_ai_assistant');
    });

    it('should throw error when plan features not found', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: null }));

      await expect(service.grantEntitlementsFromAssignment(mockAssignment))
        .rejects.toThrow('Plan features not found');
    });
  });

  describe('revokeEntitlementsFromAssignment', () => {
    it('should revoke all organization-provided entitlements', async () => {
      const mockAssignments = [
        {
          id: 'assign-001',
          user_id: 'user-123',
          organization_subscription_id: 'sub-001'
        }
      ];

      vi.mocked(ssoClient.fetch).mockImplementation(async (url: string) => {
        if (typeof url === 'string' && url.includes('getPoolAssignments')) {
          return createMockResponse({ data: mockAssignments });
        }
        return createMockResponse({ success: true });
      });

      await expect(service.revokeEntitlementsFromAssignment('assign-001'))
        .resolves.not.toThrow();
    });

    it('should throw error when assignment not found', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: [] }));

      await expect(service.revokeEntitlementsFromAssignment('assign-999'))
        .rejects.toThrow('Assignment not found');
    });
  });

  describe('hasOrganizationAccess', () => {
    it('should return organization access when user has org-provided entitlement', async () => {
      const mockEntitlements = [
        {
          id: 'ent-001',
          user_id: 'user-123',
          feature_key: 'feature_ai',
          is_active: true,
          granted_by_organization: true,
          expires_at: null
        }
      ];

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockEntitlements }));

      const result = await service.hasOrganizationAccess('user-123', 'feature_ai');

      expect(result.hasAccess).toBe(true);
      expect(result.source).toBe('organization');
    });

    it('should return personal access when user has self-purchased entitlement', async () => {
      const mockEntitlements = [
        {
          id: 'ent-002',
          user_id: 'user-123',
          feature_key: 'feature_ai',
          is_active: true,
          granted_by_organization: false,
          expires_at: new Date(Date.now() + 86400000).toISOString()
        }
      ];

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockEntitlements }));

      const result = await service.hasOrganizationAccess('user-123', 'feature_ai');

      expect(result.hasAccess).toBe(true);
      expect(result.source).toBe('personal');
    });

    it('should return no access when user has no entitlement', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: [] }));

      const result = await service.hasOrganizationAccess('user-123', 'feature_ai');

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
          feature_key: 'feature_ai',
          is_active: true,
          granted_by_organization: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'ent-002',
          user_id: 'user-123',
          feature_key: 'feature_custom',
          is_active: true,
          granted_by_organization: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockEntitlements }));

      const result = await service.getUserEntitlements('user-123');

      expect(result.organizationProvided).toHaveLength(1);
      expect(result.selfPurchased).toHaveLength(1);
      expect(result.organizationProvided[0].featureKey).toBe('feature_ai');
    });
  });

  describe('syncOrganizationEntitlements', () => {
    it('should sync entitlements for active assignments', async () => {
      const mockAssignments = [
        {
          id: 'assign-001',
          user_id: 'user-123',
          organization_subscription_id: 'sub-001',
          userId: 'user-123',
          organizationSubscriptionId: 'sub-001'
        }
      ];

      const mockPlan = { features: ['feature_ai'] };

      vi.mocked(ssoClient.fetch).mockImplementation(async (url: string) => {
        if (url.includes('getSubscriptions')) return createMockResponse({ data: mockAssignments });
        if (url.includes('getPoolAssignments')) return createMockResponse({ data: mockAssignments });
        if (url.includes('getPlansCache')) return createMockResponse({ data: mockPlan });
        return createMockResponse({ data: { id: 'ent-1', user_id: 'user-123', feature_key: 'feature_ai' } });
      });

      await expect(service.syncOrganizationEntitlements('sub-001'))
        .resolves.not.toThrow();
    });

    it('should do nothing when no active assignments exist', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: [] }));

      await expect(service.syncOrganizationEntitlements('sub-001'))
        .resolves.not.toThrow();
    });
  });

  describe('bulkGrantEntitlements', () => {
    it('should grant entitlements to multiple users', async () => {
      const mockResult = [
        {
          id: 'ent-001',
          userId: 'user-123',
          featureKey: 'feature_ai',
          isActive: true,
          grantedByOrganization: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockResult }));

      const result = await service.bulkGrantEntitlements(
        ['user-123'],
        ['feature_ai'],
        'sub-001',
        'admin-456'
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('bulkRevokeEntitlements', () => {
    it('should revoke entitlements from multiple users', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ success: true }));

      await expect(service.bulkRevokeEntitlements(
        ['user-123'],
        'sub-001'
      )).resolves.not.toThrow();
    });

    it('should throw error on failure', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ error: { message: 'Revoke failed' } }, 500, false));

      await expect(service.bulkRevokeEntitlements(
        ['user-123'],
        'sub-001'
      )).rejects.toThrow('Revoke failed');
    });
  });

  describe('getOrganizationEntitlementStats', () => {
    it('should return correct statistics', async () => {
      const mockStats = {
        totalMembers: 3,
        activeEntitlements: 5,
        featureBreakdown: { feature_ai: 3 }
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockStats }));

      const result = await service.getOrganizationEntitlementStats('sub-001');

      expect(result.totalMembers).toBe(3);
      expect(result.activeEntitlements).toBe(5);
      expect(result.featureBreakdown['feature_ai']).toBe(3);
    });

    it('should return zeros when no entitlements exist', async () => {
      const mockStats = {
        totalMembers: 0,
        activeEntitlements: 0,
        featureBreakdown: {}
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockStats }));

      const result = await service.getOrganizationEntitlementStats('sub-001');

      expect(result.totalMembers).toBe(0);
      expect(result.activeEntitlements).toBe(0);
      expect(result.featureBreakdown).toEqual({});
    });
  });
});
