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
        .eq('invitee_email', request.email.toLowerCase())
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        throw new Error('An invitation is already pending for this email');
      }

      // 2. Get current user and their role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's role from users table
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const invitedByRole = userData?.role || 'school_admin';

      // 3. Convert memberType to full role based on organization type
      // Database expects: school_student, school_educator, college_student, college_educator, etc.
      const inviteeRole = this.getFullRoleName(request.memberType, request.organizationType);

      // 4. Generate secure invitation token
      const invitationToken = this.generateSecureToken();

      // 5. Calculate expiration (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // 6. Create invitation record
      // Note: Using actual column names from the database schema
      const { data: invitation, error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: request.organizationId,
          organization_type: request.organizationType,
          invitee_email: request.email.toLowerCase(),
          invitee_role: inviteeRole,
          invited_by: user.id,
          invited_by_role: invitedByRole,
          license_pool_id: request.autoAssignSubscription ? request.licensePoolId : null,
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
      // Get current user for cancelled_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('organization_invitations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
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
          accepted_by_user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // 4. Link user to organization
      await this.linkUserToOrganization(
        userId,
        invitation.organization_id,
        invitation.organization_type,
        invitation.invitee_role
      );

      // 5. Auto-assign license if configured (license_pool_id presence indicates auto-assign)
      let assignedLicense: LicenseAssignment | undefined;
      if (invitation.license_pool_id) {
        try {
          assignedLicense = await licenseManagementService.assignLicense(
            invitation.license_pool_id,
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
          accepted_by_user_id: userId
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
        query = query.eq('invitee_role', options.memberType);
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
   * Convert simple member type (student/educator) to full role name based on organization type
   * Database constraint requires: school_student, school_educator, college_student, college_educator, etc.
   */
  private getFullRoleName(
    memberType: 'educator' | 'student',
    organizationType: 'school' | 'college' | 'university'
  ): string {
    const roleMap: Record<string, Record<string, string>> = {
      school: {
        student: 'school_student',
        educator: 'school_educator',
      },
      college: {
        student: 'college_student',
        educator: 'college_educator',
      },
      university: {
        student: 'college_student', // University uses college roles
        educator: 'college_educator',
      },
    };

    return roleMap[organizationType]?.[memberType] || `${organizationType}_${memberType}`;
  }

  /**
   * Send invitation email via email-api Cloudflare Worker
   * Uses the generic endpoint with full HTML template
   */
  private async sendInvitationEmail(
    invitation: any,
    customMessage?: string
  ): Promise<boolean> {
    const EMAIL_API_URL = 'https://email-api.dark-mode-d021.workers.dev';
    // Use current origin in development, production URL otherwise
    const APP_URL = import.meta.env.DEV 
      ? window.location.origin 
      : 'https://skillpassport.rareminds.in';

    try {
      // Get organization name for the email
      const organizationName = await this.getOrganizationName(
        invitation.organization_id,
        invitation.organization_type
      );

      const invitationLink = `${APP_URL}/accept-invitation?token=${invitation.invitation_token}`;
      const memberType = invitation.invitee_role;
      const memberTypeDisplay = memberType.includes('educator') ? 'Educator' : 'Student';
      const expiresDate = new Date(invitation.expires_at).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Organization Invitation</title></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f7fa;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">You're Invited!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hello,</p>
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                You have been invited to join <strong>${organizationName}</strong> as a <strong>${memberTypeDisplay}</strong> on Skill Passport.
              </p>
              ${customMessage ? `
              <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #6366F1;">
                <p style="margin: 0; color: #4B5563; font-style: italic;">"${customMessage}"</p>
              </div>
              ` : ''}
              <div style="background-color: #EFF6FF; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 16px; color: #1F2937; font-size: 18px;">Invitation Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Organization</td>
                    <td style="padding: 8px 0; color: #1F2937; font-weight: 600; text-align: right;">${organizationName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Role</td>
                    <td style="padding: 8px 0; color: #6366F1; font-weight: 600; text-align: right;">${memberTypeDisplay}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B7280;">Expires</td>
                    <td style="padding: 8px 0; color: #1F2937; text-align: right;">${expiresDate}</td>
                  </tr>
                </table>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${invitationLink}" style="display: inline-block; background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">Accept Invitation</a>
              </div>
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #92400E; font-size: 14px;">This invitation will expire on ${expiresDate}. Please accept it before then.</p>
              </div>
              <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #F9FAFB; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">© ${new Date().getFullYear()} Skill Passport by Rareminds. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // Use the generic endpoint with full HTML
      const response = await fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: invitation.invitee_email,
          subject: `You're invited to join ${organizationName} on Skill Passport`,
          html: htmlContent,
          from: 'noreply@rareminds.in',
          fromName: 'Skill Passport'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Email sending failed:', response.status, errorText);
        return false;
      }

      const result = await response.json();
      console.log('Invitation email sent successfully:', result);
      return true;
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Don't throw - email failure shouldn't block invitation creation
      return false;
    }
  }

  /**
   * Link user to organization
   * 
   * Updates the appropriate tables to associate the user with the organization:
   * - students table: school_id or college_id
   * - school_educators table: school_id (for school educators)
   * - users table: organizationId and role
   * 
   * @param userId - The user's auth ID
   * @param organizationId - The organization's ID
   * @param organizationType - Type of organization (school, college, university)
   * @param inviteeRole - Full role name (e.g., school_student, college_educator)
   */
  private async linkUserToOrganization(
    userId: string,
    organizationId: string,
    organizationType: 'school' | 'college' | 'university',
    inviteeRole: string
  ): Promise<void> {
    try {
      // Determine if this is an educator or student based on the role
      const isEducator = inviteeRole.includes('educator');
      const isStudent = inviteeRole.includes('student');

      console.log('🔗 Linking user to organization:', {
        userId,
        organizationId,
        organizationType,
        inviteeRole,
        isEducator,
        isStudent
      });

      // Build update data for students/educators tables
      const memberUpdateData: Record<string, any> = {};
      if (organizationType === 'school') {
        memberUpdateData.school_id = organizationId;
      } else if (organizationType === 'college' || organizationType === 'university') {
        memberUpdateData.college_id = organizationId;
      }

      // Update the appropriate member table
      if (isStudent && Object.keys(memberUpdateData).length > 0) {
        const { error: studentError } = await supabase
          .from('students')
          .update(memberUpdateData)
          .eq('user_id', userId);
        
        if (studentError) {
          console.warn('Could not update students table:', studentError.message);
        } else {
          console.log('✅ Updated students table with organization');
        }
      }

      if (isEducator && organizationType === 'school') {
        // For school educators, update school_educators table
        const { error: educatorError } = await supabase
          .from('school_educators')
          .update({ school_id: organizationId })
          .eq('user_id', userId);
        
        if (educatorError) {
          console.warn('Could not update school_educators table:', educatorError.message);
        } else {
          console.log('✅ Updated school_educators table with organization');
        }
      }

      // Update the users table with organizationId and role
      const userUpdateData: Record<string, any> = {
        organizationId: organizationId,
        role: inviteeRole
      };

      const { error: userError } = await supabase
        .from('users')
        .update(userUpdateData)
        .eq('id', userId);

      if (userError) {
        console.warn('Could not update users table:', userError.message);
      } else {
        console.log('✅ Updated users table with organization and role');
      }

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
   * 
   * Database columns → Interface fields mapping:
   * - invitee_email → email
   * - invitee_role → memberType
   * - license_pool_id → targetLicensePoolId
   * - !!license_pool_id → autoAssignSubscription (derived)
   * - accepted_by_user_id → acceptedBy
   */
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
      updatedAt: data.updated_at
    };
  }
}

// Export singleton instance
export const memberInvitationService = new MemberInvitationService();
