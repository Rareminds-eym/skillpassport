/**
 * Member Invitation Service
 * 
 * Handles member invitations with auto-subscription assignment for organizations.
 * Supports single and bulk invitations with secure token management.
 */

import { supabase } from '@/lib/supabaseClient';
import { LicenseAssignment, licenseManagementService } from './licenseManagementService';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  organizationType: 'school' | 'college' | 'university';
  email: string;
  memberType: 'educator' | 'student';
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
  memberType: 'educator' | 'student';
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
  failed: Array<{
    email: string;
    error: string;
  }>;
  totalSent: number;
  totalFailed: number;
}

// ============================================================================
// Service Class
// ============================================================================

export class MemberInvitationService {
  /**
   * Invite a single member to the organization
   */
  async inviteMember(request: InviteMemberRequest): Promise<OrganizationInvitation> {
    try {
      // 1. Check if invitation already exists for this email
      const { data: existing } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', request.organizationId)
        .eq('email', request.email.toLowerCase())
        .eq('status', 'pending')
        .single();

      if (existing) {
        throw new Error('An invitation is already pending for this email');
      }

      // 2. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // 3. Generate secure invitation token
      const invitationToken = this.generateSecureToken();

      // 4. Calculate expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // 5. Create invitation record
      const { data: invitation, error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: request.organizationId,
          organization_type: request.organizationType,
          email: request.email.toLowerCase(),
          member_type: request.memberType,
          invited_by: user.id,
          auto_assign_subscription: request.autoAssignSubscription,
          target_license_pool_id: request.licensePoolId,
          status: 'pending',
          invitation_token: invitationToken,
          expires_at: expiresAt.toISOString(),
          invitation_message: request.invitationMessage,
          metadata: request.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      // 6. Send invitation email (placeholder - integrate with email service)
      await this.sendInvitationEmail(invitation, request.invitationMessage);

      return this.mapToOrganizationInvitation(invitation);
    } catch (error) {
      console.error('Error inviting member:', error);
      throw error;
    }
  }

  /**
   * Invite multiple members at once
   */
  async bulkInviteMembers(requests: InviteMemberRequest[]): Promise<BulkInviteResult> {
    const successful: OrganizationInvitation[] = [];
    const failed: Array<{ email: string; error: string }> = [];

    for (const request of requests) {
      try {
        const invitation = await this.inviteMember(request);
        successful.push(invitation);
      } catch (error) {
        failed.push({
          email: request.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      successful,
      failed,
      totalSent: successful.length,
      totalFailed: failed.length
    };
  }

  /**
   * Resend an invitation email
   */
  async resendInvitation(invitationId: string): Promise<void> {
    try {
      // 1. Get invitation
      const { data: invitation, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (error || !invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== 'pending') {
        throw new Error('Can only resend pending invitations');
      }

      // 2. Generate new token and extend expiration
      const newToken = this.generateSecureToken();
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      // 3. Update invitation
      const { error: updateError } = await supabase
        .from('organization_invitations')
        .update({
          invitation_token: newToken,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // 4. Resend email
      await this.sendInvitationEmail(
        { ...invitation, invitation_token: newToken },
        invitation.invitation_message
      );
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }

  /**
   * Cancel a pending invitation
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('status', 'pending');

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  }

  /**
   * Accept an invitation and join the organization
   */
  async acceptInvitation(
    token: string,
    userId: string
  ): Promise<InvitationAcceptResult> {
    try {
      // 1. Find invitation by token
      const { data: invitation, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('invitation_token', token)
        .eq('status', 'pending')
        .single();

      if (error || !invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // 2. Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from('organization_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);
        throw new Error('Invitation has expired');
      }

      // 3. Update invitation status
      const { error: updateError } = await supabase
        .from('organization_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // 4. Link user to organization
      await this.linkUserToOrganization(
        userId,
        invitation.organization_id,
        invitation.organization_type,
        invitation.member_type
      );

      // 5. Auto-assign license if configured
      let assignedLicense: LicenseAssignment | undefined;
      if (invitation.auto_assign_subscription && invitation.target_license_pool_id) {
        try {
          assignedLicense = await licenseManagementService.assignLicense(
            invitation.target_license_pool_id,
            userId,
            invitation.invited_by
          );
        } catch (licenseError) {
          console.warn('Could not auto-assign license:', licenseError);
          // Don't fail the invitation acceptance if license assignment fails
        }
      }

      // 6. Get organization name
      const organizationName = await this.getOrganizationName(
        invitation.organization_id,
        invitation.organization_type
      );

      return {
        invitation: this.mapToOrganizationInvitation({
          ...invitation,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: userId
        }),
        assignedLicense,
        organizationName
      };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Get all pending invitations for an organization
   */
  async getPendingInvitations(
    organizationId: string,
    organizationType?: 'school' | 'college' | 'university'
  ): Promise<OrganizationInvitation[]> {
    try {
      let query = supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (organizationType) {
        query = query.eq('organization_type', organizationType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToOrganizationInvitation);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }
  }

  /**
   * Get all invitations for an organization (all statuses)
   */
  async getAllInvitations(
    organizationId: string,
    options?: {
      status?: 'pending' | 'accepted' | 'expired' | 'cancelled';
      memberType?: 'educator' | 'student';
      limit?: number;
    }
  ): Promise<OrganizationInvitation[]> {
    try {
      let query = supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.memberType) {
        query = query.eq('member_type', options.memberType);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToOrganizationInvitation);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<OrganizationInvitation | null> {
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('invitation_token', token)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return data ? this.mapToOrganizationInvitation(data) : null;
    } catch (error) {
      console.error('Error fetching invitation by token:', error);
      throw error;
    }
  }

  /**
   * Get invitation statistics for an organization
   */
  async getInvitationStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    expired: number;
    cancelled: number;
    acceptanceRate: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('status')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pending: 0,
        accepted: 0,
        expired: 0,
        cancelled: 0,
        acceptanceRate: 0
      };

      (data || []).forEach(inv => {
        switch (inv.status) {
          case 'pending': stats.pending++; break;
          case 'accepted': stats.accepted++; break;
          case 'expired': stats.expired++; break;
          case 'cancelled': stats.cancelled++; break;
        }
      });

      // Calculate acceptance rate (accepted / (accepted + expired + cancelled))
      const completed = stats.accepted + stats.expired + stats.cancelled;
      stats.acceptanceRate = completed > 0 
        ? Math.round((stats.accepted / completed) * 100) 
        : 0;

      return stats;
    } catch (error) {
      console.error('Error fetching invitation stats:', error);
      throw error;
    }
  }

  /**
   * Expire old pending invitations (cleanup job)
   */
  async expireOldInvitations(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error expiring old invitations:', error);
      throw error;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Generate a secure random token
   */
  private generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Send invitation email (placeholder - integrate with email service)
   */
  private async sendInvitationEmail(
    invitation: any,
    customMessage?: string
  ): Promise<void> {
    // In production, this would integrate with an email service
    // like SendGrid, AWS SES, or the existing email infrastructure
    console.log('Sending invitation email:', {
      to: invitation.email,
      token: invitation.invitation_token,
      organizationId: invitation.organization_id,
      memberType: invitation.member_type,
      customMessage
    });

    // TODO: Integrate with email service
    // await emailService.sendInvitationEmail({
    //   to: invitation.email,
    //   invitationLink: `${APP_URL}/accept-invitation?token=${invitation.invitation_token}`,
    //   organizationName: await this.getOrganizationName(invitation.organization_id, invitation.organization_type),
    //   memberType: invitation.member_type,
    //   customMessage
    // });
  }

  /**
   * Link user to organization
   */
  private async linkUserToOrganization(
    userId: string,
    organizationId: string,
    organizationType: 'school' | 'college' | 'university',
    memberType: 'educator' | 'student'
  ): Promise<void> {
    try {
      // Update user's organization association based on type
      const updateData: Record<string, any> = {};

      if (organizationType === 'school') {
        updateData.school_id = organizationId;
      } else if (organizationType === 'college') {
        updateData.college_id = organizationId;
      }
      // University would need additional handling

      // Update the appropriate table based on member type
      if (memberType === 'educator') {
        await supabase
          .from('educators')
          .update(updateData)
          .eq('user_id', userId);
      } else {
        await supabase
          .from('students')
          .update(updateData)
          .eq('user_id', userId);
      }

      // Also update the users table if it has organization fields
      await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);
    } catch (error) {
      console.error('Error linking user to organization:', error);
      // Don't throw - this is a best-effort operation
    }
  }

  /**
   * Get organization name from unified organizations table
   */
  private async getOrganizationName(
    organizationId: string,
    organizationType: 'school' | 'college' | 'university'
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .eq('organization_type', organizationType)
        .single();

      if (error) throw error;

      return data?.name || 'Organization';
    } catch (error) {
      console.error('Error fetching organization name:', error);
      return 'Organization';
    }
  }

  /**
   * Map database record to OrganizationInvitation interface
   */
  private mapToOrganizationInvitation(data: any): OrganizationInvitation {
    return {
      id: data.id,
      organizationId: data.organization_id,
      organizationType: data.organization_type,
      email: data.email,
      memberType: data.member_type,
      invitedBy: data.invited_by,
      autoAssignSubscription: data.auto_assign_subscription,
      targetLicensePoolId: data.target_license_pool_id,
      status: data.status,
      invitationToken: data.invitation_token,
      expiresAt: data.expires_at,
      acceptedAt: data.accepted_at,
      acceptedBy: data.accepted_by,
      invitationMessage: data.invitation_message,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

// Export singleton instance
export const memberInvitationService = new MemberInvitationService();
