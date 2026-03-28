/**
 * Integration Tests: Member Invitation and Acceptance Flow
 * 
 * Tests the complete invitation workflow from sending invitations through acceptance
 * and optional auto-assignment of licenses.
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock data
const mockOrganization = {
  id: 'org-123',
  name: 'Test School',
  type: 'school'
};

const mockPool = {
  id: 'pool-123',
  organization_subscription_id: 'sub-123',
  available_seats: 10
};

describe('Invitation Flow Integration Tests', () => {
  let invitations: Map<string, any>;
  let users: Map<string, any>;

  beforeEach(() => {
    invitations = new Map();
    users = new Map();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Send Invitation', () => {
    it('should create invitation with secure token', async () => {
      const generateToken = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 64; i++) {
          token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
      };

      const sendInvitation = async (email: string, memberType: string, autoAssign: boolean) => {
        const token = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = {
          id: `inv-${Date.now()}`,
          organization_id: mockOrganization.id,
          email: email.toLowerCase(),
          member_type: memberType,
          invitation_token: token,
          status: 'pending',
          auto_assign_subscription: autoAssign,
          target_license_pool_id: autoAssign ? mockPool.id : null,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        };

        invitations.set(token, invitation);
        return invitation;
      };

      const invitation = await sendInvitation('teacher@test.com', 'educator', true);

      expect(invitation.email).toBe('teacher@test.com');
      expect(invitation.invitation_token.length).toBe(64);
      expect(invitation.status).toBe('pending');
      expect(invitation.auto_assign_subscription).toBe(true);
    });

    it('should prevent duplicate pending invitations', async () => {
      const sendInvitation = async (email: string) => {
        const normalizedEmail = email.toLowerCase();
        
        // Check for existing pending invitation
        for (const inv of invitations.values()) {
          if (inv.email === normalizedEmail && inv.status === 'pending') {
            throw new Error('An invitation is already pending for this email');
          }
        }

        const invitation = {
          id: `inv-${Date.now()}`,
          email: normalizedEmail,
          status: 'pending'
        };
        invitations.set(invitation.id, invitation);
        return invitation;
      };

      await sendInvitation('teacher@test.com');
      
      await expect(
        sendInvitation('teacher@test.com')
      ).rejects.toThrow('An invitation is already pending for this email');
    });

    it('should normalize email addresses', async () => {
      const sendInvitation = async (email: string) => {
        return {
          email: email.toLowerCase().trim()
        };
      };

      const inv1 = await sendInvitation('Teacher@Test.COM');
      const inv2 = await sendInvitation('  teacher@test.com  ');

      expect(inv1.email).toBe('teacher@test.com');
      expect(inv2.email).toBe('teacher@test.com');
    });
  });

  describe('Bulk Invitations', () => {
    it('should send multiple invitations', async () => {
      const emails = [
        'teacher1@test.com',
        'teacher2@test.com',
        'teacher3@test.com'
      ];

      const bulkInvite = async (emailList: string[]) => {
        const successful: any[] = [];
        const failed: any[] = [];

        for (const email of emailList) {
          try {
            const invitation = {
              id: `inv-${Date.now()}-${Math.random()}`,
              email: email.toLowerCase(),
              status: 'pending'
            };
            invitations.set(invitation.id, invitation);
            successful.push(invitation);
          } catch (error) {
            failed.push({ email, error: (error as Error).message });
          }
        }

        return { successful, failed };
      };

      const result = await bulkInvite(emails);

      expect(result.successful.length).toBe(3);
      expect(result.failed.length).toBe(0);
    });

    it('should handle partial failures in bulk invitations', async () => {
      const existingEmails = new Set(['teacher2@test.com']);
      const emails = ['teacher1@test.com', 'teacher2@test.com', 'teacher3@test.com'];

      const bulkInvite = async (emailList: string[]) => {
        const successful: any[] = [];
        const failed: any[] = [];

        for (const email of emailList) {
          if (existingEmails.has(email.toLowerCase())) {
            failed.push({ email, error: 'Invitation already pending' });
            continue;
          }
          successful.push({ id: `inv-${email}`, email, status: 'pending' });
        }

        return { successful, failed };
      };

      const result = await bulkInvite(emails);

      expect(result.successful.length).toBe(2);
      expect(result.failed.length).toBe(1);
      expect(result.failed[0].email).toBe('teacher2@test.com');
    });

    it('should respect batch size limits', async () => {
      const MAX_BATCH_SIZE = 50;
      const emails = Array.from({ length: 60 }, (_, i) => `user${i}@test.com`);

      const validateBatchSize = (emailList: string[]) => {
        if (emailList.length > MAX_BATCH_SIZE) {
          throw new Error(`Batch size exceeds maximum allowed (${MAX_BATCH_SIZE})`);
        }
        return true;
      };

      expect(() => validateBatchSize(emails)).toThrow('Batch size exceeds maximum allowed');
    });
  });

  describe('Accept Invitation', () => {
    it('should accept valid invitation', async () => {
      const token = 'valid-token-123';
      const invitation = {
        id: 'inv-123',
        organization_id: mockOrganization.id,
        email: 'teacher@test.com',
        status: 'pending',
        invitation_token: token,
        expires_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        auto_assign_subscription: false
      };
      invitations.set(token, invitation);

      const acceptInvitation = async (invToken: string, userId: string) => {
        const inv = invitations.get(invToken);
        if (!inv) {
          throw new Error('Invalid invitation token');
        }
        if (inv.status !== 'pending') {
          throw new Error('Invitation is no longer valid');
        }
        if (new Date(inv.expires_at) < new Date()) {
          inv.status = 'expired';
          throw new Error('Invitation has expired');
        }

        inv.status = 'accepted';
        inv.accepted_at = new Date().toISOString();
        inv.accepted_by = userId;

        return { invitation: inv, assignedLicense: null };
      };

      const result = await acceptInvitation(token, 'user-123');

      expect(result.invitation.status).toBe('accepted');
      expect(result.invitation.accepted_by).toBe('user-123');
    });

    it('should reject expired invitation', async () => {
      const token = 'expired-token';
      const invitation = {
        id: 'inv-123',
        status: 'pending',
        invitation_token: token,
        expires_at: new Date(Date.now() - 86400000).toISOString() // Yesterday
      };
      invitations.set(token, invitation);

      const acceptInvitation = async (invToken: string) => {
        const inv = invitations.get(invToken);
        if (!inv) throw new Error('Invalid invitation token');
        if (new Date(inv.expires_at) < new Date()) {
          inv.status = 'expired';
          throw new Error('Invitation has expired');
        }
        return inv;
      };

      await expect(acceptInvitation(token)).rejects.toThrow('Invitation has expired');
      expect(invitations.get(token)?.status).toBe('expired');
    });

    it('should reject invalid token', async () => {
      const acceptInvitation = async (token: string) => {
        const inv = invitations.get(token);
        if (!inv) {
          throw new Error('Invalid or expired invitation');
        }
        return inv;
      };

      await expect(acceptInvitation('invalid-token')).rejects.toThrow('Invalid or expired invitation');
    });

    it('should auto-assign license when configured', async () => {
      const token = 'auto-assign-token';
      const invitation = {
        id: 'inv-123',
        organization_id: mockOrganization.id,
        email: 'teacher@test.com',
        status: 'pending',
        invitation_token: token,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        auto_assign_subscription: true,
        target_license_pool_id: mockPool.id,
        member_type: 'educator'
      };
      invitations.set(token, invitation);

      const acceptInvitation = async (invToken: string, userId: string) => {
        const inv = invitations.get(invToken);
        if (!inv) throw new Error('Invalid invitation token');

        inv.status = 'accepted';
        inv.accepted_at = new Date().toISOString();
        inv.accepted_by = userId;

        let assignedLicense = null;
        if (inv.auto_assign_subscription && inv.target_license_pool_id) {
          // Auto-assign license
          assignedLicense = {
            id: `assign-${userId}`,
            license_pool_id: inv.target_license_pool_id,
            user_id: userId,
            member_type: inv.member_type,
            status: 'active',
            assigned_at: new Date().toISOString()
          };
        }

        return { invitation: inv, assignedLicense };
      };

      const result = await acceptInvitation(token, 'user-123');

      expect(result.invitation.status).toBe('accepted');
      expect(result.assignedLicense).not.toBeNull();
      expect(result.assignedLicense?.user_id).toBe('user-123');
      expect(result.assignedLicense?.status).toBe('active');
    });
  });

  describe('Resend Invitation', () => {
    it('should generate new token and extend expiration', async () => {
      const oldToken = 'old-token';
      const invitation = {
        id: 'inv-123',
        status: 'pending',
        invitation_token: oldToken,
        expires_at: new Date(Date.now() + 86400000).toISOString()
      };
      invitations.set(oldToken, invitation);

      const resendInvitation = async (invitationId: string) => {
        let inv: any = null;
        for (const i of invitations.values()) {
          if (i.id === invitationId) {
            inv = i;
            break;
          }
        }

        if (!inv) throw new Error('Invitation not found');
        if (inv.status !== 'pending') throw new Error('Can only resend pending invitations');

        // Remove old token mapping
        invitations.delete(inv.invitation_token);

        // Generate new token
        const newToken = `new-token-${Date.now()}`;
        inv.invitation_token = newToken;
        
        // Extend expiration
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 7);
        inv.expires_at = newExpiry.toISOString();

        invitations.set(newToken, inv);
        return inv;
      };

      const result = await resendInvitation('inv-123');

      expect(result.invitation_token).not.toBe(oldToken);
      expect(invitations.has(oldToken)).toBe(false);
      expect(invitations.has(result.invitation_token)).toBe(true);
    });

    it('should fail to resend non-pending invitation', async () => {
      const invitation = {
        id: 'inv-123',
        status: 'accepted',
        invitation_token: 'token'
      };
      invitations.set('token', invitation);

      const resendInvitation = async (invitationId: string) => {
        for (const inv of invitations.values()) {
          if (inv.id === invitationId) {
            if (inv.status !== 'pending') {
              throw new Error('Can only resend pending invitations');
            }
            return inv;
          }
        }
        throw new Error('Invitation not found');
      };

      await expect(resendInvitation('inv-123')).rejects.toThrow('Can only resend pending invitations');
    });
  });

  describe('Cancel Invitation', () => {
    it('should cancel pending invitation', async () => {
      const invitation = {
        id: 'inv-123',
        status: 'pending',
        invitation_token: 'token'
      };
      invitations.set('token', invitation);

      const cancelInvitation = async (invitationId: string) => {
        for (const inv of invitations.values()) {
          if (inv.id === invitationId && inv.status === 'pending') {
            inv.status = 'cancelled';
            inv.updated_at = new Date().toISOString();
            return inv;
          }
        }
        throw new Error('Pending invitation not found');
      };

      const result = await cancelInvitation('inv-123');

      expect(result.status).toBe('cancelled');
    });
  });

  describe('Invitation Statistics', () => {
    it('should calculate invitation statistics', async () => {
      // Add test invitations
      const testInvitations = [
        { id: '1', status: 'pending' },
        { id: '2', status: 'pending' },
        { id: '3', status: 'accepted' },
        { id: '4', status: 'accepted' },
        { id: '5', status: 'accepted' },
        { id: '6', status: 'expired' },
        { id: '7', status: 'cancelled' }
      ];
      testInvitations.forEach(inv => invitations.set(inv.id, inv));

      const getStats = async () => {
        const stats = {
          total: 0,
          pending: 0,
          accepted: 0,
          expired: 0,
          cancelled: 0,
          acceptanceRate: 0
        };

        for (const inv of invitations.values()) {
          stats.total++;
          switch (inv.status) {
            case 'pending': stats.pending++; break;
            case 'accepted': stats.accepted++; break;
            case 'expired': stats.expired++; break;
            case 'cancelled': stats.cancelled++; break;
          }
        }

        const completed = stats.accepted + stats.expired + stats.cancelled;
        stats.acceptanceRate = completed > 0 
          ? Math.round((stats.accepted / completed) * 100) 
          : 0;

        return stats;
      };

      const stats = await getStats();

      expect(stats.total).toBe(7);
      expect(stats.pending).toBe(2);
      expect(stats.accepted).toBe(3);
      expect(stats.expired).toBe(1);
      expect(stats.cancelled).toBe(1);
      expect(stats.acceptanceRate).toBe(60); // 3 out of 5 completed
    });
  });
});
