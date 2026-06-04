import { apiGet, apiPost } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('licenseManagement');

export interface LicensePool {
  id: string;
  organizationSubscriptionId: string;
  organizationId: string;
  organizationType: string;
  poolName: string;
  memberType: 'educator' | 'learner';
  allocatedSeats: number;
  assignedSeats: number;
  availableSeats: number;
  autoAssignNewMembers: boolean;
  assignmentCriteria: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface LicenseAssignment {
  id: string;
  licensePoolId: string;
  organizationSubscriptionId: string;
  userId: string;
  memberType: 'educator' | 'learner';
  status: 'active' | 'suspended' | 'revoked' | 'expired';
  assignedAt: string;
  assignedBy: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
  transferredFrom?: string;
  transferredTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePoolRequest {
  organizationSubscriptionId: string;
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  poolName: string;
  memberType: 'educator' | 'learner';
  allocatedSeats: number;
  autoAssignNewMembers?: boolean;
  assignmentCriteria?: Record<string, any>;
}

export interface BulkAssignmentResult {
  successful: LicenseAssignment[];
  failed: Array<{ userId: string; error: string }>;
}

export class LicenseManagementService {
  async createLicensePool(request: CreatePoolRequest): Promise<LicensePool> {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const data = await apiPost<LicensePool>('/organization', { action: 'createPool', ...request });
      return this.mapToLicensePool(data.data);
    } catch (error) {
      logger.error('Error creating license pool', error as Error);
      throw error;
    }
  }

  async getLicensePools(
    organizationId: string,
    organizationType?: 'school' | 'college' | 'university'
  ): Promise<LicensePool[]> {
    try {
      const params = new URLSearchParams({ action: 'getLicensePools', orgId: organizationId });
      if (organizationType) params.set('orgType', organizationType);
      const data = await apiGet<any[]>(`/organization?${params.toString()}`);
      return (data.data || []).map(this.mapToLicensePool);
    } catch (error) {
      logger.error('Error fetching license pools', error as Error);
      throw error;
    }
  }

  async updatePoolAllocation(poolId: string, newAllocation: number): Promise<LicensePool> {
    try {
      const data = await apiPost<LicensePool>('/organization', { action: 'updatePoolAllocation', poolId, newAllocation });
      return this.mapToLicensePool(data.data);
    } catch (error) {
      logger.error('Error updating pool allocation', error as Error);
      throw error;
    }
  }

  async assignLicense(poolId: string, userId: string, assignedBy: string): Promise<LicenseAssignment> {
    try {
      const data = await apiPost<LicenseAssignment>('/organization', { action: 'assignLicense', poolId, userId, assignedBy });
      return this.mapToLicenseAssignment(data.data);
    } catch (error) {
      logger.error('Error assigning license', error as Error);
      throw error;
    }
  }

  async unassignLicense(assignmentId: string, reason: string, revokedBy: string): Promise<void> {
    try {
      await apiPost<void>('/organization', { action: 'unassignLicense', assignmentId, reason, revokedBy });
    } catch (error) {
      logger.error('Error unassigning license', error as Error);
      throw error;
    }
  }

  async transferLicense(
    fromUserId: string,
    toUserId: string,
    transferredBy: string,
    organizationSubscriptionId: string
  ): Promise<LicenseAssignment> {
    try {
      const data = await apiPost<LicenseAssignment>('/organization', {
        action: 'transferLicense', fromUserId, toUserId, transferredBy, organizationSubscriptionId,
      });
      return this.mapToLicenseAssignment(data.data);
    } catch (error) {
      logger.error('Error transferring license', error as Error);
      throw error;
    }
  }

  async bulkAssignLicenses(poolId: string, userIds: string[], assignedBy: string): Promise<BulkAssignmentResult> {
    const successful: LicenseAssignment[] = [];
    const failed: Array<{ userId: string; error: string }> = [];

    for (const userId of userIds) {
      try {
        const assignment = await this.assignLicense(poolId, userId, assignedBy);
        successful.push(assignment);
      } catch (error) {
        failed.push({ userId, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return { successful, failed };
  }

  async getUserAssignments(userId: string): Promise<LicenseAssignment[]> {
    try {
      const data = await apiGet<any[]>(`/organization?action=getUserAssignments&userId=${encodeURIComponent(userId)}`);
      return (data.data || []).map(this.mapToLicenseAssignment);
    } catch (error) {
      logger.error('Error fetching user assignments', error as Error);
      throw error;
    }
  }

  async getPoolAssignments(poolId: string): Promise<LicenseAssignment[]> {
    try {
      const data = await apiGet<any[]>(`/organization?action=getPoolAssignments&poolId=${encodeURIComponent(poolId)}`);
      return (data.data || []).map(this.mapToLicenseAssignment);
    } catch (error) {
      logger.error('Error fetching pool assignments', error as Error);
      throw error;
    }
  }

  async getAvailableSeats(organizationId: string, memberType: 'educator' | 'learner'): Promise<number> {
    try {
      const pools = await this.getLicensePools(organizationId);
      return pools.filter(p => p.memberType === memberType && p.isActive)
        .reduce((sum, pool) => sum + pool.availableSeats, 0);
    } catch (error) {
      logger.error('Error fetching available seats', error as Error);
      throw error;
    }
  }

  async configureAutoAssignment(poolId: string, criteria: Record<string, any>, enabled: boolean = true): Promise<LicensePool> {
    try {
      const data = await apiPost<LicensePool>('/organization', { action: 'configureAutoAssignment', poolId, criteria, enabled });
      return this.mapToLicensePool(data.data);
    } catch (error) {
      logger.error('Error configuring auto-assignment', error as Error);
      throw error;
    }
  }

  async processAutoAssignments(organizationId: string): Promise<LicenseAssignment[]> {
    try {
      const pools = await this.getLicensePools(organizationId);
      const activePools = pools.filter(p => p.autoAssignNewMembers && p.isActive);
      return [];
    } catch (error) {
      logger.error('Error processing auto-assignments', error as Error);
      throw error;
    }
  }

  private mapToLicensePool(data: any): LicensePool {
    return {
      id: data.id,
      organizationSubscriptionId: data.organization_subscription_id,
      organizationId: data.organization_id,
      organizationType: data.organization_type,
      poolName: data.pool_name,
      memberType: data.member_type,
      allocatedSeats: data.allocated_seats,
      assignedSeats: data.assigned_seats,
      availableSeats: data.available_seats,
      autoAssignNewMembers: data.auto_assign_new_members,
      assignmentCriteria: data.assignment_criteria,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
    };
  }

  private mapToLicenseAssignment(data: any): LicenseAssignment {
    return {
      id: data.id,
      licensePoolId: data.license_pool_id,
      organizationSubscriptionId: data.organization_subscription_id,
      userId: data.user_id,
      memberType: data.member_type,
      status: data.status,
      assignedAt: data.assigned_at,
      assignedBy: data.assigned_by,
      expiresAt: data.expires_at,
      revokedAt: data.revoked_at,
      revokedBy: data.revoked_by,
      revocationReason: data.revocation_reason,
      transferredFrom: data.transferred_from,
      transferredTo: data.transferred_to,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const licenseManagementService = new LicenseManagementService();
