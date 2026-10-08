import { apiGet, apiPost } from '@/shared/api/apiClient';
import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';
import { useAuthStore } from '@/shared/model/authStore';
import { LicenseAssignment } from './licenseManagementService';

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

export interface InviteEducatorRequest {
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  email: string;
}

/** Delivery result reported by SSO. Absent means SSO did not confirm delivery. */
export type EmailStatus = 'sent' | 'failed';

/** A pending (unaccepted) SSO invitation. Never carries the invite token or its hash. */
export interface SsoPendingInvite {
  readonly inviteId: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly createdAt: string | null;
  readonly expiresAt: string | null;
  readonly status: 'pending' | 'expired';
}

export interface SsoInviteList {
  readonly invites: readonly SsoPendingInvite[];
  readonly truncated: boolean;
}

export interface SsoInviteResent {
  readonly inviteId: string;
  readonly email: string;
  readonly expiresAt: string;
  readonly emailStatus?: EmailStatus;
}

export class EducatorInviteUnsupportedError extends Error {
  constructor(message = 'Educator invitations are not supported for university organizations.') {
    super(message);
    this.name = 'EducatorInviteUnsupportedError';
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

// Strict map: no guessing a role for organization types that have no educator profile table.
const EDUCATOR_ROLE_BY_ORG_TYPE: Readonly<Record<string, string>> = {
  college: 'college_educator',
  school: 'school_educator',
};

export class MemberInvitationService {
  /**
   * Educator invites go through the SSO service (single source of truth); the SkillPassport-only
   * invite path is retired for educators. Rejections surface as SsoWorkflowError (code preserved).
   */
  async inviteEducator(request: InviteEducatorRequest): Promise<{ inviteId: string; email: string; expiresAt: string; emailStatus?: EmailStatus }> {
    const email = request.email.trim().toLowerCase();
    if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
      throw new Error('Please enter a valid email address');
    }
    if (!request.organizationId?.trim()) throw new Error('Organization is required');
    const role = EDUCATOR_ROLE_BY_ORG_TYPE[request.organizationType];
    if (!role) throw new EducatorInviteUnsupportedError();

    try {
      return await ssoClient.createInvite({ email, organizationId: request.organizationId, roles: [role] });
    } catch (error) {
      logger.error('Error inviting educator', error as Error);
      throw error;
    }
  }

  /** Pending SSO invitations of the caller's active organization (admin-gated by SSO). */
  async listSsoInvites(organizationId: string): Promise<SsoInviteList> {
    try {
      return await ssoClient.listInvites({ organizationId });
    } catch (error) {
      logger.error('Error listing SSO invitations', error as Error);
      throw error;
    }
  }

  /** Issues a fresh token and expiry for a pending SSO invitation and re-sends the email. */
  async resendSsoInvite(inviteId: string): Promise<SsoInviteResent> {
    try {
      return await ssoClient.resendInvite({ inviteId });
    } catch (error) {
      logger.error('Error resending SSO invitation', error as Error);
      throw error;
    }
  }

  async inviteMember(request: InviteMemberRequest): Promise<OrganizationInvitation> {
    if (request.memberType === 'educator') {
      throw new Error('Educator invitations are sent through SSO; use inviteEducator');
    }
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

  /** The server takes the accepting user from the authenticated session; no user id is sent. */
  async acceptInvitation(token: string): Promise<InvitationAcceptResult> {
    try {
      const result = await apiPost<any>('/organization', { action: 'acceptInvitation', token });
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
