import { apiGet, apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('organizationMember');

export interface OrganizationMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  memberType: 'educator' | 'learner';
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
  memberType?: 'educator' | 'learner' | 'all';
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

export class OrganizationMemberService {
  async fetchOrganizationMembers(options: FetchMembersOptions): Promise<FetchMembersResult> {
    const { organizationId, organizationType, memberType = 'all', includeAssignmentStatus = true, searchQuery, limit = 100, offset = 0 } = options;

    if (!organizationId) {
      logger.warn('No organizationId provided, returning empty result');
      return { members: [], total: 0, hasMore: false };
    }

    try {
      const members: OrganizationMember[] = [];
      let totalCount = 0;

      if (memberType === 'all' || memberType === 'learner') {
        const params = new URLSearchParams({
          action: 'getLearners', orgId: organizationId, orgType: organizationType,
          limit: String(limit), offset: String(offset),
        });
        if (searchQuery) params.set('searchQuery', searchQuery);
        const result = await apiGet<{ members: any[]; total: number }>(`/organization?${params.toString()}`);
        const r = result?.data || { members: [], total: 0 };
        members.push(...(r.members || []).map((l: any) => ({
          id: l.id, userId: l.user_id || l.id, name: l.name || 'Unknown Learner',
          email: l.email || '', memberType: 'learner' as const,
          department: l.branch_field || l.course_name, grade: l.grade, section: l.section,
          hasLicense: false, profilePicture: l.profilePicture, phone: l.contactNumber || l.contact_number,
          status: l.approval_status,
        })));
        totalCount += r.total || 0;
      }

      if (memberType === 'all' || memberType === 'educator') {
        const params = new URLSearchParams({
          action: 'getEducators', orgId: organizationId, orgType: organizationType,
          limit: String(limit), offset: String(offset),
        });
        if (searchQuery) params.set('searchQuery', searchQuery);
        const result = await apiGet<{ members: any[]; total: number }>(`/organization?${params.toString()}`);
        const r = result?.data || { members: [], total: 0 };
        members.push(...(r.members || []).map((e: any) => ({
          id: e.id, userId: e.user_id || e.id,
          name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Unknown Educator',
          email: e.email || '', memberType: 'educator' as const,
          department: e.department, designation: e.designation,
          hasLicense: false, profilePicture: e.photo_url || e.photoUrl,
          phone: e.phone_number || e.phone, status: e.account_status || e.accountStatus,
        })));
        totalCount += r.total || 0;
      }

      if (includeAssignmentStatus && members.length > 0) {
        await this.enrichWithAssignmentStatus(members, organizationId);
      }

      return { members, total: totalCount, hasMore: members.length >= limit };
    } catch (error) {
      logger.error('Error fetching organization members', error as Error);
      throw error;
    }
  }

  private async enrichWithAssignmentStatus(members: OrganizationMember[], organizationId: string): Promise<void> {
    try {
      const userIds = members.map(m => m.userId).filter(Boolean);
      if (userIds.length === 0) return;

      const result = await apiGet<{ assignments: any[]; poolMap: Record<string, string> }>(
        `/organization?action=getLicensedMembers&orgId=${encodeURIComponent(organizationId)}`
      );
      const r = result?.data;

      const poolMap = r?.poolMap || {};
      const assignmentMap = new Map<string, any>();
      (r?.assignments || []).forEach((assignment: any) => {
        if (poolMap[assignment.license_pool_id]) {
          assignmentMap.set(assignment.user_id, {
            ...assignment, pool_name: poolMap[assignment.license_pool_id],
          });
        }
      });

      members.forEach(member => {
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

  async getMemberById(memberId: string, memberType: 'educator' | 'learner', organizationType: 'school' | 'college' | 'university'): Promise<OrganizationMember | null> {
    try {
      if (memberType === 'learner') {
        const learnersRes = await apiGet<{ members: any[] }>(
          `/organization?action=getLearners&orgId=&orgType=${organizationType}`
        );
        const allLearners = learnersRes?.data?.members || [];
        const data = allLearners.find((l: any) => l.id === memberId);
        if (!data) return null;
        return {
          id: data.id, userId: data.user_id || data.id, name: data.name || 'Unknown Learner',
          email: data.email || '', memberType: 'learner', department: data.branch_field || data.course_name,
          grade: data.grade, section: data.section, hasLicense: false,
          profilePicture: data.profilePicture, phone: data.contactNumber || data.contact_number,
          status: data.approval_status,
        };
      }

      const result = await apiGet<{ members: any[] }>(
        `/organization?action=getEducators&orgId=&orgType=${organizationType}`
      );
      const allEducators = result?.data?.members || [];
      const data = allEducators.find((e: any) => e.id === memberId);
      if (!data) return null;
      return {
        id: data.id, userId: data.user_id || data.id,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown Educator',
        email: data.email || '', memberType: 'educator', department: data.department,
        designation: data.designation, hasLicense: false, profilePicture: data.photo_url,
        phone: data.phone_number || data.phone, status: data.account_status || data.accountStatus,
      };
    } catch (error) {
      logger.error('Error fetching member by ID', error as Error);
      return null;
    }
  }

  async getMemberCounts(organizationId: string, organizationType: 'school' | 'college' | 'university'): Promise<{ learners: number; educators: number; total: number }> {
    try {
      const res = await apiGet<any>(`/organization?action=getMemberCounts&orgId=${encodeURIComponent(organizationId)}&orgType=${organizationType}`);
      return res?.data || { learners: 0, educators: 0, total: 0 };
    } catch (error) {
      logger.error('Error fetching member counts', error as Error);
      return { learners: 0, educators: 0, total: 0 };
    }
  }

  async removeMember(
    memberId: string, memberType: 'educator' | 'learner',
    organizationType: 'school' | 'college' | 'university',
    organizationId: string, revokedBy?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiPost<any>('/organization', { action: 'removeMember', memberId, memberType, organizationType, organizationId, revokedBy });
      return res?.data || { success: false, message: 'Failed to remove member' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to remove member' };
    }
  }
}

export const organizationMemberService = new OrganizationMemberService();
