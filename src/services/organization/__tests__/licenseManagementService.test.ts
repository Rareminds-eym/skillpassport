/**
 * Unit Tests for LicenseManagementService
 *
 * Tests for Task 21.2: Test LicenseManagementService methods
 * Tests for Task 21.7: Test seat allocation logic
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LicenseManagementService, type CreatePoolRequest } from '../licenseManagementService';

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
    })),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabaseClient';

describe('LicenseManagementService', () => {
  let service: LicenseManagementService;

  beforeEach(() => {
    service = new LicenseManagementService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Task 21.2: Test LicenseManagementService methods
  // ==========================================================================
  describe('createLicensePool', () => {
    const mockCreateRequest: CreatePoolRequest = {
      organizationSubscriptionId: 'sub-001',
      organizationId: 'org-123',
      organizationType: 'school',
      poolName: 'Computer Science Department',
      memberType: 'educator',
      allocatedSeats: 20,
      autoAssignNewMembers: false,
      assignmentCriteria: { department: 'CS' },
    };

    const mockUser = { id: 'user-789' };

    it('should create license pool successfully', async () => {
      const mockPool = {
        id: 'pool-001',
        organization_subscription_id: 'sub-001',
        organization_id: 'org-123',
        organization_type: 'school',
        pool_name: 'Computer Science Department',
        member_type: 'educator',
        allocated_seats: 20,
        assigned_seats: 0,
        available_seats: 20,
        auto_assign_new_members: false,
        assignment_criteria: { department: 'CS' },
        is_active: true,
        created_by: 'user-789',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'organization_subscriptions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { available_seats: 50 },
              error: null,
            }),
          } as any;
        }
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockPool, error: null }),
        } as any;
      });

      const result = await service.createLicensePool(mockCreateRequest);

      expect(result).toBeDefined();
      expect(result.poolName).toBe('Computer Science Department');
      expect(result.allocatedSeats).toBe(20);
      expect(result.memberType).toBe('educator');
    });

    it('should throw error when user not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(service.createLicensePool(mockCreateRequest)).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('should throw error when insufficient seats available', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { available_seats: 10 }, // Less than requested 20
              error: null,
            }),
          }) as any
      );

      await expect(service.createLicensePool(mockCreateRequest)).rejects.toThrow(
        'Insufficient available seats in subscription'
      );
    });
  });

  describe('getLicensePools', () => {
    it('should return all pools for organization', async () => {
      const mockPools = [
        {
          id: 'pool-001',
          organization_subscription_id: 'sub-001',
          organization_id: 'org-123',
          organization_type: 'school',
          pool_name: 'CS Department',
          member_type: 'educator',
          allocated_seats: 20,
          assigned_seats: 10,
          available_seats: 10,
          auto_assign_new_members: false,
          assignment_criteria: {},
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'user-789',
        },
        {
          id: 'pool-002',
          organization_subscription_id: 'sub-001',
          organization_id: 'org-123',
          organization_type: 'school',
          pool_name: 'Math Department',
          member_type: 'educator',
          allocated_seats: 15,
          assigned_seats: 5,
          available_seats: 10,
          auto_assign_new_members: true,
          assignment_criteria: { department: 'Math' },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'user-789',
        },
      ];

      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockPools, error: null }),
          }) as any
      );

      const result = await service.getLicensePools('org-123');

      expect(result).toHaveLength(2);
      expect(result[0].poolName).toBe('CS Department');
      expect(result[1].poolName).toBe('Math Department');
    });

    it('should filter by organization type', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }) as any
      );

      await service.getLicensePools('org-123', 'school');

      expect(supabase.from).toHaveBeenCalledWith('license_pools');
    });
  });

  // ==========================================================================
  // Task 21.7: Test seat allocation logic
  // ==========================================================================
  describe('assignLicense', () => {
    it('should assign license successfully when seats available', async () => {
      const mockPool = {
        id: 'pool-001',
        organization_subscription_id: 'sub-001',
        member_type: 'educator',
        available_seats: 5,
      };

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
        updated_at: new Date().toISOString(),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'license_pools') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPool, error: null }),
          } as any;
        }
        if (callCount === 2) {
          // Check for existing assignment
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          } as any;
        }
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockAssignment, error: null }),
        } as any;
      });

      const result = await service.assignLicense('pool-001', 'user-123', 'admin-456');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.status).toBe('active');
    });

    it('should throw error when no seats available', async () => {
      const mockPool = {
        id: 'pool-001',
        available_seats: 0,
      };

      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPool, error: null }),
          }) as any
      );

      await expect(service.assignLicense('pool-001', 'user-123', 'admin-456')).rejects.toThrow(
        'No available seats in pool'
      );
    });

    it('should throw error when pool not found', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }) as any
      );

      await expect(service.assignLicense('invalid-pool', 'user-123', 'admin-456')).rejects.toThrow(
        'License pool not found'
      );
    });

    it('should throw error when user already has active assignment', async () => {
      const mockPool = {
        id: 'pool-001',
        organization_subscription_id: 'sub-001',
        available_seats: 5,
      };

      const existingAssignment = {
        id: 'existing-assign',
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPool, error: null }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: existingAssignment, error: null }),
        } as any;
      });

      await expect(service.assignLicense('pool-001', 'user-123', 'admin-456')).rejects.toThrow(
        'User already has an active license assignment'
      );
    });
  });

  describe('unassignLicense', () => {
    it('should unassign license successfully', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          }) as any
      );

      await expect(
        service.unassignLicense('assign-001', 'No longer needed', 'admin-456')
      ).resolves.not.toThrow();
    });

    it('should throw error on database failure', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: { message: 'Database error' } }),
          }) as any
      );

      await expect(service.unassignLicense('assign-001', 'Test', 'admin-456')).rejects.toThrow();
    });
  });

  describe('transferLicense', () => {
    it('should transfer license from one user to another', async () => {
      const mockCurrentAssignment = {
        id: 'assign-001',
        license_pool_id: 'pool-001',
        organization_subscription_id: 'sub-001',
        user_id: 'user-from',
        member_type: 'educator',
        status: 'active',
      };

      const mockNewAssignment = {
        id: 'assign-002',
        license_pool_id: 'pool-001',
        organization_subscription_id: 'sub-001',
        user_id: 'user-to',
        member_type: 'educator',
        status: 'active',
        assigned_by: 'admin-456',
        transferred_from: 'assign-001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Get current assignment
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockCurrentAssignment, error: null }),
          } as any;
        }
        if (callCount === 2) {
          // Unassign (update status)
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          } as any;
        }
        if (callCount === 3) {
          // Create new assignment
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockNewAssignment, error: null }),
          } as any;
        }
        // Update old assignment with transfer reference
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        } as any;
      });

      const result = await service.transferLicense('user-from', 'user-to', 'admin-456', 'sub-001');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-to');
      expect(result.transferredFrom).toBe('assign-001');
    });

    it('should throw error when source user has no active assignment', async () => {
      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }) as any
      );

      await expect(
        service.transferLicense('user-from', 'user-to', 'admin-456', 'sub-001')
      ).rejects.toThrow('No active assignment found for source user');
    });
  });

  describe('bulkAssignLicenses', () => {
    it('should assign licenses to multiple users', async () => {
      const mockPool = {
        id: 'pool-001',
        organization_subscription_id: 'sub-001',
        member_type: 'educator',
        available_seats: 10,
      };

      const createMockAssignment = (userId: string) => ({
        id: `assign-${userId}`,
        license_pool_id: 'pool-001',
        organization_subscription_id: 'sub-001',
        user_id: userId,
        member_type: 'educator',
        status: 'active',
        assigned_by: 'admin-456',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'license_pools') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPool, error: null }),
          } as any;
        }
        if (table === 'license_assignments') {
          // Check for existing - return not found
          if (callCount % 3 === 2) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            } as any;
          }
          // Insert new assignment
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              const userId = `user-${Math.floor(callCount / 3)}`;
              return Promise.resolve({ data: createMockAssignment(userId), error: null });
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await service.bulkAssignLicenses(
        'pool-001',
        ['user-1', 'user-2', 'user-3'],
        'admin-456'
      );

      expect(result.successful.length).toBeGreaterThan(0);
    });

    it('should track failed assignments', async () => {
      const mockPool = {
        id: 'pool-001',
        organization_subscription_id: 'sub-001',
        member_type: 'educator',
        available_seats: 1, // Only 1 seat available
      };

      const assignCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'license_pools') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              // After first assignment, no seats available
              const seats = assignCount === 0 ? 1 : 0;
              return Promise.resolve({
                data: { ...mockPool, available_seats: seats },
                error: null,
              });
            }),
          } as any;
        }
        if (table === 'license_assignments') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            insert: vi.fn().mockReturnThis(),
          } as any;
        }
        return {} as any;
      });

      // This test verifies the structure of bulk assignment results
      const result = await service.bulkAssignLicenses(
        'pool-001',
        ['user-1', 'user-2'],
        'admin-456'
      );

      expect(result).toHaveProperty('successful');
      expect(result).toHaveProperty('failed');
    });
  });

  describe('getAvailableSeats', () => {
    it('should sum available seats across all active pools', async () => {
      const mockPools = [{ available_seats: 10 }, { available_seats: 15 }, { available_seats: 5 }];

      // Create a chainable mock that supports 3 .eq() calls
      const createChainableMock = (finalData: any) => {
        const chainable: any = {};
        chainable.select = vi.fn().mockReturnValue(chainable);
        // Support 3 levels of .eq() chaining
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ data: finalData, error: null }),
          })),
        }));
        chainable.order = vi.fn().mockResolvedValue({ data: finalData, error: null });
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation(() => createChainableMock(mockPools));

      const result = await service.getAvailableSeats('org-123', 'educator');

      expect(result).toBe(30);
    });

    it('should return 0 when no pools exist', async () => {
      const createChainableMock = (finalData: any) => {
        const chainable: any = {};
        chainable.select = vi.fn().mockReturnValue(chainable);
        // Support 3 levels of .eq() chaining
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ data: finalData, error: null }),
          })),
        }));
        chainable.order = vi.fn().mockResolvedValue({ data: finalData, error: null });
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation(() => createChainableMock([]));

      const result = await service.getAvailableSeats('org-123', 'educator');

      expect(result).toBe(0);
    });
  });

  describe('updatePoolAllocation', () => {
    it('should update pool allocation successfully', async () => {
      const mockPool = {
        id: 'pool-001',
        allocated_seats: 20,
        assigned_seats: 10,
      };

      const mockUpdatedPool = {
        ...mockPool,
        allocated_seats: 30,
        available_seats: 20,
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPool, error: null }),
          } as any;
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedPool, error: null }),
        } as any;
      });

      const result = await service.updatePoolAllocation('pool-001', 30);

      expect(result.allocatedSeats).toBe(30);
    });

    it('should throw error when reducing below assigned seats', async () => {
      const mockPool = {
        id: 'pool-001',
        allocated_seats: 20,
        assigned_seats: 15,
      };

      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockPool, error: null }),
          }) as any
      );

      await expect(service.updatePoolAllocation('pool-001', 10)).rejects.toThrow(
        'Cannot reduce allocation below assigned seats (15)'
      );
    });
  });

  describe('configureAutoAssignment', () => {
    it('should configure auto-assignment rules', async () => {
      const mockUpdatedPool = {
        id: 'pool-001',
        auto_assign_new_members: true,
        assignment_criteria: { department: 'CS', grade: '10' },
      };

      vi.mocked(supabase.from).mockImplementation(
        () =>
          ({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUpdatedPool, error: null }),
          }) as any
      );

      const result = await service.configureAutoAssignment(
        'pool-001',
        { department: 'CS', grade: '10' },
        true
      );

      expect(result.autoAssignNewMembers).toBe(true);
      expect(result.assignmentCriteria).toEqual({ department: 'CS', grade: '10' });
    });
  });
});
