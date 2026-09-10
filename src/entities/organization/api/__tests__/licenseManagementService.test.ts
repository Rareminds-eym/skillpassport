/**
 * Unit Tests for LicenseManagementService
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/shared/model/authStore';
import {
    LicenseManagementService,
    type CreatePoolRequest
} from '../licenseManagementService';

// Mock SSO client
vi.mock('@/shared/api/ssoClient', () => ({
  ssoClient: {
    fetch: vi.fn(),
    getAccessToken: vi.fn(() => 'test-token')
  }
}));

import { ssoClient } from '@/shared/api/ssoClient';

// Mock useAuthStore
vi.mock('@/shared/model/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: { id: 'user-789' }
    }))
  }
}));

function createMockResponse<T>(data: T, status = 200, ok = true): Response {
  return {
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(),
    redirected: false,
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

describe('LicenseManagementService', () => {
  let service: LicenseManagementService;

  beforeEach(() => {
    service = new LicenseManagementService();
    vi.clearAllMocks();
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: { id: 'user-789' }
    } as unknown as ReturnType<typeof useAuthStore.getState>);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createLicensePool', () => {
    const mockRequest: CreatePoolRequest = {
      organizationSubscriptionId: 'sub-001',
      organizationId: 'org-123',
      organizationType: 'school',
      poolName: 'Teachers Pool',
      memberType: 'educator',
      allocatedSeats: 25,
      autoAssignNewMembers: true
    };

    const mockPool = {
      id: 'pool-001',
      organization_subscription_id: 'sub-001',
      organization_id: 'org-123',
      organization_type: 'school',
      pool_name: 'Teachers Pool',
      member_type: 'educator',
      allocated_seats: 25,
      assigned_seats: 0,
      available_seats: 25,
      auto_assign_new_members: true,
      is_active: true,
      created_by: 'user-789',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    it('should create pool successfully', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockPool }));

      const result = await service.createLicensePool(mockRequest);

      expect(result).toBeDefined();
      expect(result.id).toBe('pool-001');
      expect(result.poolName).toBe('Teachers Pool');
      expect(result.allocatedSeats).toBe(25);
    });

    it('should throw error when user not authenticated', async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({ user: null } as unknown as ReturnType<typeof useAuthStore.getState>);

      await expect(service.createLicensePool(mockRequest))
        .rejects.toThrow('User not authenticated');
    });
  });

  describe('getLicensePools', () => {
    it('should return pools for organization', async () => {
      const mockPools = [
        {
          id: 'pool-001',
          organization_subscription_id: 'sub-001',
          organization_id: 'org-123',
          organization_type: 'school',
          pool_name: 'Teachers Pool',
          member_type: 'educator',
          allocated_seats: 25,
          assigned_seats: 10,
          available_seats: 15,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockPools }));

      const result = await service.getLicensePools('org-123', 'school');

      expect(result).toHaveLength(1);
      expect(result[0].poolName).toBe('Teachers Pool');
      expect(result[0].availableSeats).toBe(15);
    });
  });

  describe('updatePoolAllocation', () => {
    it('should update pool allocation successfully', async () => {
      const mockUpdatedPool = {
        id: 'pool-001',
        organization_subscription_id: 'sub-001',
        organization_id: 'org-123',
        organization_type: 'school',
        pool_name: 'Teachers Pool',
        member_type: 'educator',
        allocated_seats: 30,
        assigned_seats: 15,
        available_seats: 15,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockUpdatedPool }));

      const result = await service.updatePoolAllocation('pool-001', 30);

      expect(result.allocatedSeats).toBe(30);
    });

    it('should throw error when reducing below assigned seats', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(
        createMockResponse({ error: { message: 'Cannot reduce allocation below assigned seats (15)' } }, 400, false)
      );

      await expect(service.updatePoolAllocation('pool-001', 10))
        .rejects.toThrow('Cannot reduce allocation below assigned seats (15)');
    });
  });

  describe('assignLicense', () => {
    it('should assign license to user', async () => {
      const mockAssignment = {
        id: 'assign-001',
        license_pool_id: 'pool-001',
        organization_subscription_id: 'sub-001',
        user_id: 'user-123',
        member_type: 'educator',
        status: 'active',
        assigned_at: new Date().toISOString(),
        assigned_by: 'admin-456',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockAssignment }));

      const result = await service.assignLicense('pool-001', 'user-123', 'admin-456');

      expect(result).toBeDefined();
      expect(result.id).toBe('assign-001');
      expect(result.userId).toBe('user-123');
    });

    it('should throw error when no seats available', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(
        createMockResponse({ error: { message: 'No available seats in pool' } }, 400, false)
      );

      await expect(service.assignLicense('pool-001', 'user-123', 'admin-456'))
        .rejects.toThrow('No available seats in pool');
    });
  });

  describe('unassignLicense', () => {
    it('should unassign license successfully', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ success: true }));

      await expect(service.unassignLicense('assign-001', 'Role change', 'admin-456'))
        .resolves.not.toThrow();
    });
  });

  describe('transferLicense', () => {
    it('should transfer license from one user to another', async () => {
      const mockAssignment = {
        id: 'assign-002',
        license_pool_id: 'pool-001',
        organization_subscription_id: 'sub-001',
        user_id: 'user-to',
        member_type: 'educator',
        status: 'active',
        assigned_at: new Date().toISOString(),
        assigned_by: 'admin-456',
        transferred_from: 'user-from',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockAssignment }));

      const result = await service.transferLicense('user-from', 'user-to', 'admin-456', 'sub-001');

      expect(result.userId).toBe('user-to');
      expect(result.transferredFrom).toBe('user-from');
    });

    it('should throw error when source user has no active assignment', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(
        createMockResponse({ error: { message: 'No active assignment found for source user' } }, 400, false)
      );

      await expect(service.transferLicense('user-from', 'user-to', 'admin-456', 'sub-001'))
        .rejects.toThrow('No active assignment found for source user');
    });
  });

  describe('bulkAssignLicenses', () => {
    it('should assign licenses to multiple users', async () => {
      const mockAssignment = {
        id: 'assign-001',
        license_pool_id: 'pool-001',
        organization_subscription_id: 'sub-001',
        user_id: 'user-123',
        member_type: 'educator',
        status: 'active',
        assigned_at: new Date().toISOString(),
        assigned_by: 'admin-456',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockAssignment }));

      const result = await service.bulkAssignLicenses(
        'pool-001',
        ['user-123', 'user-456'],
        'admin-456'
      );

      expect(result.successful.length).toBeGreaterThan(0);
    });
  });

  describe('getAvailableSeats', () => {
    it('should sum available seats across all active pools', async () => {
      const mockPools = [
        {
          id: 'pool-001',
          available_seats: 10,
          is_active: true
        },
        {
          id: 'pool-002',
          available_seats: 15,
          is_active: true
        }
      ];

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockPools }));

      const totalAvailable = await service.getAvailableSeats('org-123');

      expect(totalAvailable).toBe(25);
    });

    it('should return 0 when no pools exist', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: [] }));

      const totalAvailable = await service.getAvailableSeats('org-123');

      expect(totalAvailable).toBe(0);
    });
  });

  describe('configureAutoAssignment', () => {
    it('should configure auto-assignment rules', async () => {
      const mockPool = {
        id: 'pool-001',
        organization_subscription_id: 'sub-001',
        organization_id: 'org-123',
        organization_type: 'school',
        pool_name: 'Teachers Pool',
        member_type: 'educator',
        allocated_seats: 25,
        assigned_seats: 0,
        available_seats: 25,
        auto_assign_new_members: true,
        is_active: true,
        created_by: 'user-789',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockPool }));

      await expect(service.configureAutoAssignment('pool-001', true, { department: 'CS' }))
        .resolves.not.toThrow();
    });
  });
});
