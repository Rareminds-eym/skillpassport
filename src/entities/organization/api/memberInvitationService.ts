import { apiGet, apiPost } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';
import { LicenseAssignment, licenseManagementService } from './licenseManagementService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('memberInvitation');

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  email: string;
  memberType: 'educator' | 'learner';
  invitedBy: string;
  autoAssignSubscription: boolean;
  targetLicensePoolId?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitationToken: string;
  expiresAt: string;
  acceptedAt?: string;
  acceptedBy?: string;
  invitationMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface InviteMemberRequest {
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  email: string;
  memberType: 'educator' | 'learner';
  autoAssignSubscription: boolean;
  licensePoolId?: string;
  invitationMessage?: string;
  metadata?: Record<string, any>;
}

export interface InvitationAcceptResult {
  invitation: OrganizationInvitation;
  assignedLicense?: LicenseAssignment;
  organizationName: string;
}

export interface BulkInviteResult {
  successful: OrganizationInvitation[];
  failed: Array<{ email: string; error: string }>;
  totalSent: number;
  totalFailed: number;
}

export class MemberInvitationService {
  async inviteMember(request: InviteMemberRequest): Promise<OrganizationInvitation> {
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const data = await apiPost<any>('/organization', { action: 'inviteMember', ...request });
      return this.mapToOrganizationInvitation(data.data);
    } catch (error) {
      logger.error('Error inviting member', error as Error);
      throw error;
    }
  }

  async bulkInviteMembers(requests: InviteMemberRequest[]): Promise<BulkInviteResult> {
    const successful: OrganizationInvitation[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    for (const request of requests) {
      try {
        const invitation = await this.inviteMember(request);
        successful.push(invitation);
      } catch (error) {
        failed.push({ email: request.email, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return { successful, failed, totalSent: successful.length, totalFailed: failed.length };
  }

  async resendInvitation(invitationId: string): Promise<void> {
    try {
      await apiPost('/organization', { action: 'resendInvitation', invitationId });
    } catch (error) {
      logger.error('Error resending invitation', error as Error);
      throw error;
    }
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      await apiPost('/organization', { action: 'cancelInvitation', invitationId });
    } catch (error) {
      logger.error('Error cancelling invitation', error as Error);
      throw error;
    }
  }

  async acceptInvitation(token: string, userId: string): Promise<InvitationAcceptResult> {
    try {
      const result = await apiPost<any>('/organization', { action: 'acceptInvitation', token, userId });
      const d = result.data;
      return {
        invitation: this.mapToOrganizationInvitation(d),
        organizationName: d?.organization_name || 'Organization',
      };
    } catch (error) {
      logger.error('Error accepting invitation', error as Error);
      throw error;
    }
  }

  async getPendingInvitations(
    organizationId: string,
    organizationType?: 'school' | 'college' | 'university'
  ): Promise<OrganizationInvitation[]> {
    try {
      const params = new URLSearchParams({ action: 'getPendingInvitations', orgId: organizationId });
      if (organizationType) params.set('orgType', organizationType);
      const data = await apiGet<any[]>(`/organization?${params.toString()}`);
      return (data.data || []).map(this.mapToOrganizationInvitation);
    } catch (error) {
      logger.error('Error fetching pending invitations', error as Error);
      throw error;
    }
  }

  async getAllInvitations(
    organizationId: string,
    options?: { status?: string; memberType?: string; limit?: number }
  ): Promise<OrganizationInvitation[]> {
    try {
      const params = new URLSearchParams({ action: 'getAllInvitations', orgId: organizationId });
      if (options?.status) params.set('status', options.status);
      if (options?.memberType) params.set('memberType', options.memberType);
      if (options?.limit) params.set('limit', String(options.limit));
      const result = await apiGet<any[]>(`/organization?${params.toString()}`);
      return (result.data || []).map(this.mapToOrganizationInvitation);
    } catch (error) {
      logger.error('Error fetching invitations', error as Error);
      throw error;
    }
  }

  async getInvitationByToken(token: string): Promise<OrganizationInvitation | null> {
    try {
      const result = await apiGet<any>(`/organization?action=getInvitationByToken&token=${encodeURIComponent(token)}`);
      const d = result.data;
      return d ? this.mapToOrganizationInvitation(d) : null;
    } catch (error) {
      logger.error('Error fetching invitation by token', error as Error);
      return null;
    }
  }

  async getInvitationStats(organizationId: string): Promise<{
    total: number; pending: number; accepted: number; expired: number; cancelled: number; acceptanceRate: number;
  }> {
    try {
      const result = await apiGet(`/organization?action=getInvitationStats&orgId=${encodeURIComponent(organizationId)}`);
      return result.data;
    } catch (error) {
      logger.error('Error fetching invitation stats', error as Error);
      throw error;
    }
  }

  async expireOldInvitations(): Promise<number> {
    try {
      const result = await apiPost<{ count: number }>('/organization', { action: 'expireOldInvitations' });
      return result.data.count;
    } catch (error) {
      logger.error('Error expiring old invitations', error as Error);
      throw error;
    }
  }

  private mapToOrganizationInvitation(data: any): OrganizationInvitation {
    return {
      id: data.id,
      organizationId: data.organization_id,
      organizationType: data.organization_type,
      email: data.invitee_email,
      memberType: data.invitee_role,
      invitedBy: data.invited_by,
      autoAssignSubscription: !!data.license_pool_id,
      targetLicensePoolId: data.license_pool_id,
      status: data.status,
      invitationToken: data.invitation_token,
      expiresAt: data.expires_at,
      acceptedAt: data.accepted_at,
      acceptedBy: data.accepted_by_user_id,
      invitationMessage: data.invitation_message,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const memberInvitationService = new MemberInvitationService();
