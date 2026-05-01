/**
 * Organization Member Service
 * 
 * Fetches and manages organization members (students and educators).
 * Integrates with license assignments to show member subscription status.
 */

import { supabase } from '@/shared/api';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('organizationMember');

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface OrganizationMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  memberType: 'educator' | 'student';
  department?: string;
  designation?: string;
  grade?: string;
  section?: string;
  hasLicense: boolean;
  assignedAt?: string;
  poolName?: string;
  licenseAssignmentId?: string;
  profilePicture?: string;
  phone?: string;
  status?: string;
}

export interface FetchMembersOptions {
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  memberType?: 'educator' | 'student' | 'all';
  includeAssignmentStatus?: boolean;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export interface FetchMembersResult {
  members: OrganizationMember[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// Service Class
// ============================================================================

export class OrganizationMemberService {
  /**
   * Fetch all members (students and educators) for an organization
   */
  async fetchOrganizationMembers(
    options: FetchMembersOptions
  ): Promise<FetchMembersResult> {
    const {
      organizationId,
      organizationType,
      memberType = 'all',
      includeAssignmentStatus = true,
      searchQuery,
      limit = 100,
      offset = 0,
    } = options;

    // Early return if no organizationId
    if (!organizationId) {
      logger.warn('No organizationId provided, returning empty result');
      return { members: [], total: 0, hasMore: false };
    }

    try {
      const members: OrganizationMember[] = [];
      let totalCount = 0;

      // Fetch students if needed
      if (memberType === 'all' || memberType === 'student') {
        const studentResult = await this.fetchStudents(
          organizationId,
          organizationType,
          searchQuery,
          limit,
          offset
        );
        members.push(...studentResult.members);
        totalCount += studentResult.total;
      }

      // Fetch educators if needed
      if (memberType === 'all' || memberType === 'educator') {
        const educatorResult = await this.fetchEducators(
          organizationId,
          organizationType,
          searchQuery,
          limit,
          offset
        );
        members.push(...educatorResult.members);
        totalCount += educatorResult.total;
      }

      // If we need assignment status, fetch and merge it
      if (includeAssignmentStatus && members.length > 0) {
        await this.enrichWithAssignmentStatus(members, organizationId);
      }

      return {
        members,
        total: totalCount,
        hasMore: members.length >= limit,
      };
    } catch (error) {
      logger.error('Error fetching organization members', error as Error);
      throw error;
    }
  }

  /**
   * Fetch students for an organization
   */
  private async fetchStudents(
    organizationId: string,
    organizationType: 'school' | 'college' | 'university',
    searchQuery?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ members: OrganizationMember[]; total: number }> {
    try {
      // Build query based on organization type
      let query = supabase
        .from('students')
        .select('*', { count: 'exact' });

      // Filter by organization
      if (organizationType === 'school') {
        query = query.eq('school_id', organizationId);
      } else if (organizationType === 'college') {
        query = query.eq('college_id', organizationId);
      } else if (organizationType === 'university') {
        query = query.eq('universityId', organizationId);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      // Filter out deleted students
      query = query.or('is_deleted.is.null,is_deleted.eq.false');

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const members: OrganizationMember[] = (data || []).map((student) => ({
        id: student.id,
        userId: student.user_id || student.id,
        name: student.name || 'Unknown Student',
        email: student.email || '',
        memberType: 'student' as const,
        department: student.branch_field || student.course_name,
        grade: student.grade,
        section: student.section,
        hasLicense: false, // Will be enriched later
        profilePicture: student.profilePicture,
        phone: student.contactNumber || student.contact_number,
        status: student.approval_status,
      }));

      return { members, total: count || 0 };
    } catch (error) {
      logger.error('Error fetching students', error as Error);
      return { members: [], total: 0 };
    }
  }

  /**
   * Fetch educators for an organization
   */
  private async fetchEducators(
    organizationId: string,
    organizationType: 'school' | 'college' | 'university',
    searchQuery?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ members: OrganizationMember[]; total: number }> {
    try {
      let members: OrganizationMember[] = [];
      let total = 0;

      if (organizationType === 'school') {
        // Fetch from school_educators table
        let query = supabase
          .from('school_educators')
          .select('*', { count: 'exact' })
          .eq('school_id', organizationId);

        if (searchQuery) {
          query = query.or(
            `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
          );
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        members = (data || []).map((educator) => ({
          id: educator.id,
          userId: educator.user_id || educator.id,
          name: `${educator.first_name || ''} ${educator.last_name || ''}`.trim() || 'Unknown Educator',
          email: educator.email || '',
          memberType: 'educator' as const,
          department: educator.department,
          designation: educator.designation,
          hasLicense: false,
          profilePicture: educator.photo_url,
          phone: educator.phone_number,
          status: educator.account_status,
        }));

        total = count || 0;
      } else if (organizationType === 'college') {
        // Fetch from college_lecturers table
        let query = supabase
          .from('college_lecturers')
          .select('*', { count: 'exact' })
          .eq('collegeId', organizationId);

        if (searchQuery) {
          query = query.or(
            `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
          );
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;

        members = (data || []).map((lecturer) => ({
          id: lecturer.id,
          userId: lecturer.user_id || lecturer.id,
          name: `${lecturer.first_name || ''} ${lecturer.last_name || ''}`.trim() || 'Unknown Lecturer',
          email: lecturer.email || '',
          memberType: 'educator' as const,
          department: lecturer.department,
          designation: lecturer.designation,
          hasLicense: false,
          profilePicture: undefined,
          phone: lecturer.phone,
          status: lecturer.accountStatus,
        }));

        total = count || 0;
      }
      // University educators would need a separate table - add when available

      return { members, total };
    } catch (error) {
      logger.error('Error fetching educators', error as Error);
      return { members: [], total: 0 };
    }
  }

  /**
   * Enrich members with their license assignment status
   */
  private async enrichWithAssignmentStatus(
    members: OrganizationMember[],
    organizationId: string
  ): Promise<void> {
    try {
      // Get all user IDs
      const userIds = members.map((m) => m.userId).filter(Boolean);

      if (userIds.length === 0) return;

      // Fetch active license assignments for these users
      const { data: assignments, error } = await supabase
        .from('license_assignments')
        .select(`
          id,
          user_id,
          assigned_at,
          license_pool_id
        `)
        .in('user_id', userIds)
        .eq('status', 'active');

      if (error) {
        logger.error('Error fetching license assignments', error as Error);
        return;
      }

      // Get pool names separately
      const poolIds = [...new Set((assignments || []).map(a => a.license_pool_id))];
      let poolMap = new Map<string, string>();
      
      if (poolIds.length > 0) {
        const { data: pools } = await supabase
          .from('license_pools')
          .select('id, pool_name')
          .in('id', poolIds)
          .eq('organization_id', organizationId);
        
        (pools || []).forEach(pool => {
          poolMap.set(pool.id, pool.pool_name);
        });
      }

      // Create a map for quick lookup
      const assignmentMap = new Map<string, any>();
      (assignments || []).forEach((assignment) => {
        // Only include if the pool belongs to this organization
        if (poolMap.has(assignment.license_pool_id)) {
          assignmentMap.set(assignment.user_id, {
            ...assignment,
            pool_name: poolMap.get(assignment.license_pool_id)
          });
        }
      });

      // Enrich members with assignment data
      members.forEach((member) => {
        const assignment = assignmentMap.get(member.userId);
        if (assignment) {
          member.hasLicense = true;
          member.assignedAt = assignment.assigned_at;
          member.licenseAssignmentId = assignment.id;
          member.poolName = assignment.pool_name;
        }
      });
    } catch (error) {
      logger.error('Error enriching with assignment status', error as Error);
    }
  }

  /**
   * Get member by ID
   */
  async getMemberById(
    memberId: string,
    memberType: 'educator' | 'student',
    organizationType: 'school' | 'college' | 'university'
  ): Promise<OrganizationMember | null> {
    try {
      if (memberType === 'student') {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', memberId)
          .single();

        if (error || !data) return null;

        return {
          id: data.id,
          userId: data.user_id || data.id,
          name: data.name || 'Unknown Student',
          email: data.email || '',
          memberType: 'student',
          department: data.branch_field || data.course_name,
          grade: data.grade,
          section: data.section,
          hasLicense: false,
          profilePicture: data.profilePicture,
          phone: data.contactNumber || data.contact_number,
          status: data.approval_status,
        };
      } else {
        // Educator
        const table = organizationType === 'school' ? 'school_educators' : 'college_lecturers';
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('id', memberId)
          .single();

        if (error || !data) return null;

        return {
          id: data.id,
          userId: data.user_id || data.id,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown Educator',
          email: data.email || '',
          memberType: 'educator',
          department: data.department,
          designation: data.designation,
          hasLicense: false,
          profilePicture: data.photo_url,
          phone: data.phone_number || data.phone,
          status: data.account_status || data.accountStatus,
        };
      }
    } catch (error) {
      logger.error('Error fetching member by ID', error as Error);
      return null;
    }
  }

  /**
   * Get member counts by type
   */
  async getMemberCounts(
    organizationId: string,
    organizationType: 'school' | 'college' | 'university'
  ): Promise<{ students: number; educators: number; total: number }> {
    try {
      let studentCount = 0;
      let educatorCount = 0;

      // Count students
      let studentQuery = supabase
        .from('students')
        .select('id', { count: 'exact', head: true });

      if (organizationType === 'school') {
        studentQuery = studentQuery.eq('school_id', organizationId);
      } else if (organizationType === 'college') {
        studentQuery = studentQuery.eq('college_id', organizationId);
      } else {
        studentQuery = studentQuery.eq('universityId', organizationId);
      }

      studentQuery = studentQuery.or('is_deleted.is.null,is_deleted.eq.false');

      const { count: sCount } = await studentQuery;
      studentCount = sCount || 0;

      // Count educators
      if (organizationType === 'school') {
        const { count: eCount } = await supabase
          .from('school_educators')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', organizationId);
        educatorCount = eCount || 0;
      } else if (organizationType === 'college') {
        const { count: eCount } = await supabase
          .from('college_lecturers')
          .select('id', { count: 'exact', head: true })
          .eq('collegeId', organizationId);
        educatorCount = eCount || 0;
      }

      return {
        students: studentCount,
        educators: educatorCount,
        total: studentCount + educatorCount,
      };
    } catch (error) {
      logger.error('Error fetching member counts', error as Error);
      return { students: 0, educators: 0, total: 0 };
    }
  }

  /**
   * Remove a member from the organization
   * This removes the organization association but does NOT delete the user account
   * 
   * @param memberId - The member's ID (student or educator record ID)
   * @param memberType - Type of member ('student' or 'educator')
   * @param organizationType - Type of organization ('school', 'college', 'university')
   * @param organizationId - The organization's ID (for verification)
   * @param revokedBy - Optional user ID of who is performing the removal
   * @returns Success status and message
   */
  async removeMember(
    memberId: string,
    memberType: 'educator' | 'student',
    organizationType: 'school' | 'college' | 'university',
    organizationId: string,
    revokedBy?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (memberType === 'student') {
        // For students, clear the school_id or college_id
        const updateData: Record<string, any> = {};
        
        if (organizationType === 'school') {
          updateData.school_id = null;
        } else if (organizationType === 'college' || organizationType === 'university') {
          updateData.college_id = null;
        }

        // Verify the student belongs to this organization before removing
        const { data: student, error: fetchError } = await supabase
          .from('students')
          .select('id, school_id, college_id, email, name, user_id')
          .eq('id', memberId)
          .single();

        if (fetchError || !student) {
          return { success: false, message: 'Student not found' };
        }

        // Verify organization ownership
        const belongsToOrg = 
          (organizationType === 'school' && student.school_id === organizationId) ||
          ((organizationType === 'college' || organizationType === 'university') && student.college_id === organizationId);

        if (!belongsToOrg) {
          return { success: false, message: 'Student does not belong to this organization' };
        }

        // Remove organization association
        const { error: updateError } = await supabase
          .from('students')
          .update(updateData)
          .eq('id', memberId);

        if (updateError) {
          logger.error('Error removing student from organization', updateError as Error);
          return { success: false, message: updateError.message };
        }

        // Also revoke any license assignments for this user
        // Use user_id if available, otherwise fall back to student.id
        const userIdForLicense = student.user_id || student.id;
        await this.revokeMemberLicenses(userIdForLicense, organizationId, revokedBy, 'Member removed from organization');

        logger.info('Student removed from organization', { email: student.email });
        return { success: true, message: `${student.name || 'Student'} has been removed from the organization` };

      } else {
        // For educators
        if (organizationType === 'school') {
          // Verify the educator belongs to this school
          const { data: educator, error: fetchError } = await supabase
            .from('school_educators')
            .select('id, school_id, email, first_name, last_name, user_id')
            .eq('id', memberId)
            .single();

          if (fetchError || !educator) {
            return { success: false, message: 'Educator not found' };
          }

          if (educator.school_id !== organizationId) {
            return { success: false, message: 'Educator does not belong to this organization' };
          }

          // Remove organization association
          const { error: updateError } = await supabase
            .from('school_educators')
            .update({ school_id: null })
            .eq('id', memberId);

          if (updateError) {
            logger.error('Error removing educator from organization', updateError as Error);
            return { success: false, message: updateError.message };
          }

          // Revoke licenses
          if (educator.user_id) {
            await this.revokeMemberLicenses(educator.user_id, organizationId, revokedBy, 'Educator removed from organization');
          }

          const educatorName = `${educator.first_name || ''} ${educator.last_name || ''}`.trim() || 'Educator';
          logger.info('Educator removed from organization', { email: educator.email });
          return { success: true, message: `${educatorName} has been removed from the organization` };

        } else if (organizationType === 'college') {
          // Verify the lecturer belongs to this college
          const { data: lecturer, error: fetchError } = await supabase
            .from('college_lecturers')
            .select('id, collegeId, email, first_name, last_name, user_id')
            .eq('id', memberId)
            .single();

          if (fetchError || !lecturer) {
            return { success: false, message: 'Lecturer not found' };
          }

          if (lecturer.collegeId !== organizationId) {
            return { success: false, message: 'Lecturer does not belong to this organization' };
          }

          // Remove organization association
          const { error: updateError } = await supabase
            .from('college_lecturers')
            .update({ collegeId: null })
            .eq('id', memberId);

          if (updateError) {
            logger.error('Error removing lecturer from organization', updateError as Error);
            return { success: false, message: updateError.message };
          }

          // Revoke licenses
          if (lecturer.user_id) {
            await this.revokeMemberLicenses(lecturer.user_id, organizationId, revokedBy, 'Lecturer removed from organization');
          }

          const lecturerName = `${lecturer.first_name || ''} ${lecturer.last_name || ''}`.trim() || 'Lecturer';
          logger.info('Lecturer removed from organization', { email: lecturer.email });
          return { success: true, message: `${lecturerName} has been removed from the organization` };
        }

        return { success: false, message: 'Unsupported organization type for educator removal' };
      }
    } catch (error) {
      logger.error('Error removing member', error as Error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to remove member' 
      };
    }
  }

  /**
   * Revoke all license assignments for a user from a specific organization
   */
  private async revokeMemberLicenses(
    userId: string,
    organizationId: string,
    revokedBy?: string,
    reason: string = 'Member removed from organization'
  ): Promise<void> {
    try {
      // Get all license pools for this organization
      const { data: pools } = await supabase
        .from('license_pools')
        .select('id')
        .eq('organization_id', organizationId);

      if (!pools || pools.length === 0) return;

      const poolIds = pools.map(p => p.id);

      // Revoke all active assignments for this user from these pools
      const { error } = await supabase
        .from('license_assignments')
        .update({ 
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: revokedBy || null,
          revocation_reason: reason
        })
        .eq('user_id', userId)
        .in('license_pool_id', poolIds)
        .eq('status', 'active');

      if (error) {
        logger.warn('Could not revoke license assignments', { error: error?.message || String(error) });
      } else {
        logger.info('License assignments revoked for user', { userId });
      }
    } catch (error) {
      logger.warn('Error revoking member licenses', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

// Export singleton instance
export const organizationMemberService = new OrganizationMemberService();
