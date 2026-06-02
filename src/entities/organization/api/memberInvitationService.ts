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

  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    return token;
  }

  private getFullRoleName(memberType: 'educator' | 'learner', organizationType: 'school' | 'college' | 'university'): string {
    const roleMap: Record<string, Record<string, string>> = {
      school: { learner: 'learner', educator: 'school_educator' },
      college: { learner: 'learner', educator: 'college_educator' },
      university: { learner: 'learner', educator: 'college_educator' },
    };
    return roleMap[organizationType]?.[memberType] || `${organizationType}_${memberType}`;
  }

  private async sendInvitationEmail(invitation: any, customMessage?: string): Promise<boolean> {
    const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL || 
      (import.meta.env.DEV ? '/api/email' : import.meta.env.VITE_PRODUCTION_EMAIL_API_URL || 'https://skillpassport.rareminds.in/api/email');
    const VITE_APP_URL = import.meta.env.DEV ? window.location.origin : 'https://skillpassport.rareminds.in';

    try {
      let organizationName = 'Organization';
      try {
        const orgData = await apiGet<any>(`/organization?action=getOrganizationById&id=${encodeURIComponent(invitation.organization_id)}`);
        organizationName = orgData?.data?.name || 'Organization';
      } catch { /* ignore */ }

      const invitationLink = `${VITE_APP_URL}/accept-invitation?token=${invitation.invitation_token}`;
      const memberType = invitation.invitee_role;
      const memberTypeDisplay = memberType.includes('educator') ? 'Educator' : 'Learner';
      const expiresDate = new Date(invitation.expires_at).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });

      const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Organization Invitation</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background-color:#f4f7fa;">
  <table style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 0;">
    <table style="width:600px;max-width:100%;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
      <tr><td style="padding:40px;text-align:center;background:linear-gradient(135deg,#6366F1 0%,#4F46E5 100%);border-radius:12px 12px 0 0;">
        <h1 style="margin:0;color:#ffffff;font-size:28px;">You're Invited!</h1></td></tr>
      <tr><td style="padding:40px;">
        <p style="color:#374151;font-size:16px;margin-bottom:24px;">Hello,</p>
        <p style="color:#374151;font-size:16px;margin-bottom:24px;">You have been invited to join <strong>${organizationName}</strong> as a <strong>${memberTypeDisplay}</strong> on Skill Passport.</p>
        ${customMessage ? `<div style="background-color:#F3F4F6;border-radius:8px;padding:20px;margin:24px 0;border-left:4px solid #6366F1;"><p style="margin:0;color:#4B5563;font-style:italic;">"${customMessage}"</p></div>` : ''}
        <div style="background-color:#EFF6FF;border-radius:8px;padding:24px;margin:24px 0;">
          <h3 style="margin:0 0 16px;color:#1F2937;font-size:18px;">Invitation Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#6B7280;">Organization</td><td style="padding:8px 0;color:#1F2937;font-weight:600;text-align:right;">${organizationName}</td></tr>
            <tr><td style="padding:8px 0;color:#6B7280;">Role</td><td style="padding:8px 0;color:#6366F1;font-weight:600;text-align:right;">${memberTypeDisplay}</td></tr>
            <tr><td style="padding:8px 0;color:#6B7280;">Expires</td><td style="padding:8px 0;color:#1F2937;text-align:right;">${expiresDate}</td></tr>
          </table>
        </div>
        <div style="text-align:center;margin:32px 0;"><a href="${invitationLink}" style="display:inline-block;background:linear-gradient(135deg,#6366F1 0%,#4F46E5 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">Accept Invitation</a></div>
        <div style="background-color:#FEF3C7;border-left:4px solid #F59E0B;padding:16px;margin:24px 0;"><p style="margin:0;color:#92400E;font-size:14px;">This invitation will expire on ${expiresDate}. Please accept it before then.</p></div>
        <p style="color:#6B7280;font-size:14px;margin-top:24px;">If you didn't expect this invitation, you can safely ignore this email.</p></td></tr>
      <tr><td style="padding:24px 40px;background-color:#F9FAFB;border-radius:0 0 12px 12px;text-align:center;"><p style="margin:0;color:#9CA3AF;font-size:12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.</p></td></tr>
    </table></td></tr></table>
</body></html>`;

      const response = await fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: invitation.invitee_email,
          subject: `You're invited to join ${organizationName} on Skill Passport`,
          html: htmlContent,
          from: 'noreply@rareminds.in',
          fromName: 'Skill Passport',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Email sending failed', new Error(`Status: ${response.status}, ${errorText}`));
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Failed to send invitation email', error as Error);
      return false;
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
