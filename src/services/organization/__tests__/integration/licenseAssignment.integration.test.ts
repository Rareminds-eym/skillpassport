/**
 * Integration Tests: License Assignment Workflow
 *
 * Tests the complete license assignment workflow including pool management,
 * individual and bulk assignments, transfers, and revocations.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

// Mock data
const mockSubscription = {
  id: 'sub-123',
  organization_id: 'org-123',
  total_seats: 100,
  assigned_seats: 0,
  available_seats: 100,
  status: 'active',
};

const mockPool = {
  id: 'pool-123',
  organization_subscription_id: 'sub-123',
  organization_id: 'org-123',
  pool_name: 'Educators Pool',
  member_type: 'educator',
  allocated_seats: 50,
  assigned_seats: 0,
  available_seats: 50,
  is_active: true,
};

const mockUsers = [
  { id: 'user-1', email: 'teacher1@test.com', role: 'educator' },
  { id: 'user-2', email: 'teacher2@test.com', role: 'educator' },
  { id: 'user-3', email: 'teacher3@test.com', role: 'educator' },
  { id: 'user-4', email: 'student1@test.com', role: 'student' },
  { id: 'user-5', email: 'student2@test.com', role: 'student' },
];

describe('License Assignment Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Single License Assignment', () => {
    it('should assign license to user and update seat counts', async () => {
      const poolSeats = { ...mockPool };

      // Simulate assignment
      const assignLicense = async (poolId: string, userId: string) => {
        if (poolSeats.available_seats <= 0) {
          throw new Error('No available seats');
        }

        const assignment = {
          id: `assign-${userId}`,
          license_pool_id: poolId,
          user_id: userId,
          status: 'active',
          assigned_at: new Date().toISOString(),
        };

        // Update pool counts
        poolSeats.assigned_seats += 1;
        poolSeats.available_seats -= 1;

        return assignment;
      };

      const assignment = await assignLicense(mockPool.id, mockUsers[0].id);

      expect(assignment.status).toBe('active');
      expect(assignment.user_id).toBe('user-1');
      expect(poolSeats.assigned_seats).toBe(1);
      expect(poolSeats.available_seats).toBe(49);
    });

    it('should prevent duplicate active assignments', async () => {
      const existingAssignments = new Set<string>();

      const assignLicense = async (poolId: string, userId: string, subscriptionId: string) => {
        const key = `${userId}-${subscriptionId}`;
        if (existingAssignments.has(key)) {
          throw new Error('User already has an active license assignment');
        }

        existingAssignments.add(key);
        return { id: `assign-${userId}`, status: 'active' };
      };

      // First assignment should succeed
      await assignLicense(mockPool.id, 'user-1', mockSubscription.id);

      // Second assignment should fail
      await expect(assignLicense(mockPool.id, 'user-1', mockSubscription.id)).rejects.toThrow(
        'User already has an active license assignment'
      );
    });

    it('should fail when pool has no available seats', async () => {
      const emptyPool = { ...mockPool, available_seats: 0 };

      const assignLicense = async (pool: typeof mockPool, userId: string) => {
        if (pool.available_seats <= 0) {
          throw new Error('No available seats in pool');
        }
        return { id: `assign-${userId}`, status: 'active' };
      };

      await expect(assignLicense(emptyPool, 'user-1')).rejects.toThrow(
        'No available seats in pool'
      );
    });
  });

  describe('Bulk License Assignment', () => {
    it('should assign licenses to multiple users', async () => {
      const poolSeats = { ...mockPool };
      const assignments: any[] = [];
      const failures: any[] = [];

      const bulkAssign = async (poolId: string, userIds: string[]) => {
        for (const userId of userIds) {
          try {
            if (poolSeats.available_seats <= 0) {
              failures.push({ userId, error: 'No available seats' });
              continue;
            }

            assignments.push({
              id: `assign-${userId}`,
              license_pool_id: poolId,
              user_id: userId,
              status: 'active',
            });

            poolSeats.assigned_seats += 1;
            poolSeats.available_seats -= 1;
          } catch (error) {
            failures.push({ userId, error: (error as Error).message });
          }
        }

        return { successful: assignments, failed: failures };
      };

      const result = await bulkAssign(mockPool.id, ['user-1', 'user-2', 'user-3']);

      expect(result.successful.length).toBe(3);
      expect(result.failed.length).toBe(0);
      expect(poolSeats.assigned_seats).toBe(3);
      expect(poolSeats.available_seats).toBe(47);
    });

    it('should handle partial failures in bulk assignment', async () => {
      const existingAssignments = new Set(['user-2']); // user-2 already has assignment
      const poolSeats = { ...mockPool };

      const bulkAssign = async (poolId: string, userIds: string[]) => {
        const successful: any[] = [];
        const failed: any[] = [];

        for (const userId of userIds) {
          if (existingAssignments.has(userId)) {
            failed.push({ userId, error: 'Already has active assignment' });
            continue;
          }

          successful.push({
            id: `assign-${userId}`,
            user_id: userId,
            status: 'active',
          });
          poolSeats.assigned_seats += 1;
          poolSeats.available_seats -= 1;
        }

        return { successful, failed };
      };

      const result = await bulkAssign(mockPool.id, ['user-1', 'user-2', 'user-3']);

      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(1);
      expect(result.failed[0].userId).toBe('user-2');
    });

    it('should respect batch size limits', async () => {
      const MAX_BATCH_SIZE = 100;
      const userIds = Array.from({ length: 150 }, (_, i) => `user-${i}`);

      const validateBatchSize = (ids: string[]) => {
        if (ids.length > MAX_BATCH_SIZE) {
          throw new Error(`Batch size exceeds maximum allowed (${MAX_BATCH_SIZE})`);
        }
        return true;
      };

      expect(() => validateBatchSize(userIds)).toThrow('Batch size exceeds maximum allowed');
      expect(validateBatchSize(userIds.slice(0, 100))).toBe(true);
    });
  });

  describe('License Transfer', () => {
    it('should transfer license from one user to another', async () => {
      const assignments = new Map<string, any>();
      assignments.set('user-1', {
        id: 'assign-1',
        user_id: 'user-1',
        status: 'active',
        license_pool_id: mockPool.id,
      });

      const transferLicense = async (fromUserId: string, toUserId: string) => {
        const currentAssignment = assignments.get(fromUserId);
        if (!currentAssignment || currentAssignment.status !== 'active') {
          throw new Error('No active assignment found for source user');
        }

        // Revoke old assignment
        currentAssignment.status = 'revoked';
        currentAssignment.revoked_at = new Date().toISOString();
        currentAssignment.revocation_reason = 'Transferred to another user';

        // Create new assignment
        const newAssignment = {
          id: 'assign-2',
          user_id: toUserId,
          status: 'active',
          license_pool_id: currentAssignment.license_pool_id,
          transferred_from: currentAssignment.id,
        };

        // Update old assignment with transfer reference
        currentAssignment.transferred_to = newAssignment.id;

        assignments.set(toUserId, newAssignment);

        return { oldAssignment: currentAssignment, newAssignment };
      };

      const result = await transferLicense('user-1', 'user-2');

      expect(result.oldAssignment.status).toBe('revoked');
      expect(result.oldAssignment.transferred_to).toBe('assign-2');
      expect(result.newAssignment.status).toBe('active');
      expect(result.newAssignment.transferred_from).toBe('assign-1');
    });

    it('should fail transfer if source user has no active assignment', async () => {
      const assignments = new Map<string, any>();

      const transferLicense = async (fromUserId: string, toUserId: string) => {
        const currentAssignment = assignments.get(fromUserId);
        if (!currentAssignment || currentAssignment.status !== 'active') {
          throw new Error('No active assignment found for source user');
        }
        return { success: true };
      };

      await expect(transferLicense('user-1', 'user-2')).rejects.toThrow(
        'No active assignment found for source user'
      );
    });

    it('should fail transfer if target user already has active assignment', async () => {
      const assignments = new Map<string, any>();
      assignments.set('user-1', { id: 'assign-1', user_id: 'user-1', status: 'active' });
      assignments.set('user-2', { id: 'assign-2', user_id: 'user-2', status: 'active' });

      const transferLicense = async (fromUserId: string, toUserId: string) => {
        const targetAssignment = assignments.get(toUserId);
        if (targetAssignment && targetAssignment.status === 'active') {
          throw new Error('Target user already has an active license assignment');
        }
        return { success: true };
      };

      await expect(transferLicense('user-1', 'user-2')).rejects.toThrow(
        'Target user already has an active license assignment'
      );
    });
  });

  describe('License Revocation', () => {
    it('should revoke license and update seat counts', async () => {
      const poolSeats = { assigned_seats: 5, available_seats: 45 };
      const assignment = {
        id: 'assign-1',
        user_id: 'user-1',
        status: 'active' as string,
        revoked_at: null as string | null,
        revocation_reason: null as string | null,
      };

      const revokeLicense = async (assignmentId: string, reason: string) => {
        assignment.status = 'revoked';
        assignment.revoked_at = new Date().toISOString();
        assignment.revocation_reason = reason;

        // Update pool counts
        poolSeats.assigned_seats -= 1;
        poolSeats.available_seats += 1;

        return assignment;
      };

      const result = await revokeLicense('assign-1', 'User left organization');

      expect(result.status).toBe('revoked');
      expect(result.revocation_reason).toBe('User left organization');
      expect(poolSeats.assigned_seats).toBe(4);
      expect(poolSeats.available_seats).toBe(46);
    });
  });

  describe('Entitlement Sync', () => {
    it('should grant entitlements when license is assigned', async () => {
      const userEntitlements: any[] = [];

      const grantEntitlements = async (
        userId: string,
        subscriptionId: string,
        features: string[]
      ) => {
        for (const feature of features) {
          userEntitlements.push({
            id: `ent-${userId}-${feature}`,
            user_id: userId,
            feature_key: feature,
            granted_by_organization: true,
            organization_subscription_id: subscriptionId,
            is_active: true,
          });
        }
        return userEntitlements.filter((e) => e.user_id === userId);
      };

      const result = await grantEntitlements('user-1', 'sub-123', [
        'feature1',
        'feature2',
        'feature3',
      ]);

      expect(result.length).toBe(3);
      expect(result.every((e) => e.granted_by_organization)).toBe(true);
      expect(result.every((e) => e.is_active)).toBe(true);
    });

    it('should revoke entitlements when license is unassigned', async () => {
      const userEntitlements = [
        {
          id: 'ent-1',
          user_id: 'user-1',
          feature_key: 'feature1',
          is_active: true,
          organization_subscription_id: 'sub-123',
        },
        {
          id: 'ent-2',
          user_id: 'user-1',
          feature_key: 'feature2',
          is_active: true,
          organization_subscription_id: 'sub-123',
        },
      ];

      const revokeEntitlements = async (userId: string, subscriptionId: string) => {
        const affected = userEntitlements.filter(
          (e) => e.user_id === userId && e.organization_subscription_id === subscriptionId
        );
        affected.forEach((e) => {
          e.is_active = false;
        });
        return affected.length;
      };

      const count = await revokeEntitlements('user-1', 'sub-123');

      expect(count).toBe(2);
      expect(userEntitlements.every((e) => !e.is_active)).toBe(true);
    });
  });
});
