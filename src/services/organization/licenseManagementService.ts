/**
 * License Management Service
 * 
 * Handles license pool creation, seat allocation, and member assignment operations.
 * Supports bulk operations and auto-assignment rules.
 * 
 * ============================================================================
 * DATABASE TRIGGERS (Important for other developers/agents)
 * ============================================================================
 * 
 * The following database triggers handle automatic license assignment and seat counting.
 * These are defined in Supabase migrations and run automatically - no frontend code needed.
 * 
 * 1. AUTO-ASSIGN TRIGGERS:
 *    - trigger_auto_assign_license_students (on INSERT to `students` table)
 *    - trigger_auto_assign_license_school_educators (on INSERT to `school_educators` table)
 *    - trigger_auto_assign_license_college_lecturers (on INSERT to `college_lecturers` table)
 *    
 *    These call `auto_assign_license_to_member()` function which:
 *    - Finds a license pool with `auto_assign_new_members = true` and `is_active = true`
 *    - Checks if pool has available seats (assigned_seats < allocated_seats)
 *    - Creates a license_assignment record if eligible
 *    - Only assigns if user doesn't already have an active license
 * 
 * 2. SEAT SYNC TRIGGER:
 *    - trigger_sync_pool_seats (on INSERT/UPDATE/DELETE to `license_assignments` table)
 *    
 *    Calls `sync_pool_assigned_seats()` function which:
 *    - Automatically updates `assigned_seats` count on the license_pool
 *    - Keeps seat counts synchronized without manual updates
 * 
 * Migration files:
 *    - implement_auto_assign_license_triggers (creates the triggers and functions)
 *    - cleanup_duplicate_pool_seat_triggers (removes any duplicate triggers)
 * 
 * ============================================================================
 */

import { supabase } from '@/lib/supabaseClient';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface LicensePool {
  id: string;
  organizationSubscriptionId: string;
  organizationId: string;
  organizationType: string;
  poolName: string;
  memberType: 'educator' | 'student';
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
  memberType: 'educator' | 'student';
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
  memberType: 'educator' | 'student';
  allocatedSeats: number;
  autoAssignNewMembers?: boolean;
  assignmentCriteria?: Record<string, any>;
}

export interface BulkAssignmentResult {
  successful: LicenseAssignment[];
  failed: Array<{ userId: string; error: string }>;
}

// ============================================================================
// Service Class
// ============================================================================

export class LicenseManagementService {
  /**
   * Create a new license pool
   */
  async createLicensePool(request: CreatePoolRequest): Promise<LicensePool> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate subscription has enough available seats
      const { data: subscription } = await supabase
        .from('organization_subscriptions')
        .select('available_seats')
        .eq('id', request.organizationSubscriptionId)
        .single();

      if (!subscription || subscription.available_seats < request.allocatedSeats) {
        throw new Error('Insufficient available seats in subscription');
      }

      // Create pool
      const { data, error } = await supabase
        .from('license_pools')
        .insert({
          organization_subscription_id: request.organizationSubscriptionId,
          organization_id: request.organizationId,
          organization_type: request.organizationType,
          pool_name: request.poolName,
          member_type: request.memberType,
          allocated_seats: request.allocatedSeats,
          assigned_seats: 0,
          auto_assign_new_members: request.autoAssignNewMembers || false,
          assignment_criteria: request.assignmentCriteria || {},
          is_active: true,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapToLicensePool(data);
    } catch (error) {
      console.error('Error creating license pool:', error);
      throw error;
    }
  }

  /**
   * Get all license pools for an organization
   */
  async getLicensePools(
    organizationId: string,
    organizationType?: 'school' | 'college' | 'university'
  ): Promise<LicensePool[]> {
    try {
      let query = supabase
        .from('license_pools')
        .select('*')
        .eq('organization_id', organizationId);

      if (organizationType) {
        query = query.eq('organization_type', organizationType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToLicensePool);
    } catch (error) {
      console.error('Error fetching license pools:', error);
      throw error;
    }
  }

  /**
   * Update pool seat allocation
   */
  async updatePoolAllocation(
    poolId: string,
    newAllocation: number
  ): Promise<LicensePool> {
    try {
      // Get current pool
      const { data: pool } = await supabase
        .from('license_pools')
        .select('*')
        .eq('id', poolId)
        .single();

      if (!pool) {
        throw new Error('License pool not found');
      }

      // Validate new allocation
      if (newAllocation < pool.assigned_seats) {
        throw new Error(
          `Cannot reduce allocation below assigned seats (${pool.assigned_seats})`
        );
      }

      // Update pool
      const { data, error } = await supabase
        .from('license_pools')
        .update({
          allocated_seats: newAllocation,
          updated_at: new Date().toISOString()
        })
        .eq('id', poolId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToLicensePool(data);
    } catch (error) {
      console.error('Error updating pool allocation:', error);
      throw error;
    }
  }

  /**
   * Assign a license to a user
   */
  async assignLicense(
    poolId: string,
    userId: string,
    assignedBy: string
  ): Promise<LicenseAssignment> {
    try {
      // Get pool details
      const { data: pool } = await supabase
        .from('license_pools')
        .select('*')
        .eq('id', poolId)
        .single();

      if (!pool) {
        throw new Error('License pool not found');
      }

      // Check available seats
      if (pool.available_seats <= 0) {
        throw new Error('No available seats in pool');
      }

      // Check if user already has an active assignment
      const { data: existing } = await supabase
        .from('license_assignments')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_subscription_id', pool.organization_subscription_id)
        .eq('status', 'active')
        .single();

      if (existing) {
        throw new Error('User already has an active license assignment');
      }

      // Create assignment
      const { data, error } = await supabase
        .from('license_assignments')
        .insert({
          license_pool_id: poolId,
          organization_subscription_id: pool.organization_subscription_id,
          user_id: userId,
          member_type: pool.member_type,
          status: 'active',
          assigned_by: assignedBy
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapToLicenseAssignment(data);
    } catch (error) {
      console.error('Error assigning license:', error);
      throw error;
    }
  }

  /**
   * Unassign a license from a user
   */
  async unassignLicense(
    assignmentId: string,
    reason: string,
    revokedBy: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('license_assignments')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: revokedBy,
          revocation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unassigning license:', error);
      throw error;
    }
  }

  /**
   * Transfer a license from one user to another
   */
  async transferLicense(
    fromUserId: string,
    toUserId: string,
    transferredBy: string,
    organizationSubscriptionId: string
  ): Promise<LicenseAssignment> {
    try {
      // Get current assignment
      const { data: currentAssignment } = await supabase
        .from('license_assignments')
        .select('*')
        .eq('user_id', fromUserId)
        .eq('organization_subscription_id', organizationSubscriptionId)
        .eq('status', 'active')
        .single();

      if (!currentAssignment) {
        throw new Error('No active assignment found for source user');
      }

      // Revoke current assignment
      await this.unassignLicense(
        currentAssignment.id,
        'Transferred to another user',
        transferredBy
      );

      // Create new assignment
      const { data: newAssignment, error } = await supabase
        .from('license_assignments')
        .insert({
          license_pool_id: currentAssignment.license_pool_id,
          organization_subscription_id: currentAssignment.organization_subscription_id,
          user_id: toUserId,
          member_type: currentAssignment.member_type,
          status: 'active',
          assigned_by: transferredBy,
          transferred_from: currentAssignment.id
        })
        .select()
        .single();

      if (error) throw error;

      // Update old assignment with transfer reference
      await supabase
        .from('license_assignments')
        .update({ transferred_to: newAssignment.id })
        .eq('id', currentAssignment.id);

      return this.mapToLicenseAssignment(newAssignment);
    } catch (error) {
      console.error('Error transferring license:', error);
      throw error;
    }
  }

  /**
   * Bulk assign licenses to multiple users
   */
  async bulkAssignLicenses(
    poolId: string,
    userIds: string[],
    assignedBy: string
  ): Promise<BulkAssignmentResult> {
    const successful: LicenseAssignment[] = [];
    const failed: Array<{ userId: string; error: string }> = [];

    for (const userId of userIds) {
      try {
        const assignment = await this.assignLicense(poolId, userId, assignedBy);
        successful.push(assignment);
      } catch (error) {
        failed.push({
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Get all assignments for a user
   */
  async getUserAssignments(userId: string): Promise<LicenseAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('license_assignments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToLicenseAssignment);
    } catch (error) {
      console.error('Error fetching user assignments:', error);
      throw error;
    }
  }

  /**
   * Get all assignments for a pool
   */
  async getPoolAssignments(poolId: string): Promise<LicenseAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('license_assignments')
        .select('*')
        .eq('license_pool_id', poolId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToLicenseAssignment);
    } catch (error) {
      console.error('Error fetching pool assignments:', error);
      throw error;
    }
  }

  /**
   * Get available seats for an organization by member type
   */
  async getAvailableSeats(
    organizationId: string,
    memberType: 'educator' | 'student'
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('license_pools')
        .select('available_seats')
        .eq('organization_id', organizationId)
        .eq('member_type', memberType)
        .eq('is_active', true);

      if (error) throw error;

      return (data || []).reduce((sum, pool) => sum + pool.available_seats, 0);
    } catch (error) {
      console.error('Error fetching available seats:', error);
      throw error;
    }
  }

  /**
   * Configure auto-assignment rules for a pool
   */
  async configureAutoAssignment(
    poolId: string,
    criteria: Record<string, any>,
    enabled: boolean = true
  ): Promise<LicensePool> {
    try {
      const { data, error } = await supabase
        .from('license_pools')
        .update({
          auto_assign_new_members: enabled,
          assignment_criteria: criteria,
          updated_at: new Date().toISOString()
        })
        .eq('id', poolId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToLicensePool(data);
    } catch (error) {
      console.error('Error configuring auto-assignment:', error);
      throw error;
    }
  }

  /**
   * Process auto-assignments for new members
   */
  async processAutoAssignments(
    organizationId: string
  ): Promise<LicenseAssignment[]> {
    try {
      // Get pools with auto-assignment enabled
      const { data: pools } = await supabase
        .from('license_pools')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('auto_assign_new_members', true)
        .eq('is_active', true);

      if (!pools || pools.length === 0) {
        return [];
      }

      const assignments: LicenseAssignment[] = [];

      // Process each pool
      for (const _pool of pools) {
        // Get eligible members based on criteria
        // This would need to be implemented based on your user schema
        // For now, returning empty array
        // TODO: Implement member matching logic based on assignment_criteria
        void _pool; // Acknowledge unused variable - implementation pending
      }

      return assignments;
    } catch (error) {
      console.error('Error processing auto-assignments:', error);
      throw error;
    }
  }

  /**
   * Map database record to LicensePool interface
   */
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
      createdBy: data.created_by
    };
  }

  /**
   * Map database record to LicenseAssignment interface
   */
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
      updatedAt: data.updated_at
    };
  }
}

// Export singleton instance
export const licenseManagementService = new LicenseManagementService();
