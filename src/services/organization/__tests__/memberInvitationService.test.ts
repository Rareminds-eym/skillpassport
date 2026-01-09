/**
 * Unit Tests for MemberInvitationService
 * 
 * Tests for Task 21.5: Test MemberInvitationService methods
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    MemberInvitationService,
    type InviteMemberRequest
} from '../memberInvitationService';

// Mock Supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn()
    })),
    auth: {
      getUser: vi.fn()
    }
  }
}));

// Mock licenseManagementService
vi.mock('../licenseManagementService', () => ({
  licenseManagementService: {
    assignLicense: vi.fn()
  }
}));

import { supabase } from '@/lib/supabaseClient';
import { licenseManagementService } from '../licenseManagementService';

describe('MemberInvitationService', () => {
  let service: MemberInvitationService;

  beforeEach(() => {
    service = new MemberInvitationService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Task 21.5: Test MemberInvitationService methods
  // ==========================================================================
  describe('inviteMember', () => {
    const mockInviteRequest: InviteMemberRequest = {
      organizationId: 'org-123',
      organizationType: 'school',
      email: 'teacher@school.com',
      memberType: 'educator',
      autoAssignSubscription: true,
      licensePoolId: 'pool-001',
      invitationMessage: 'Welcome to our school!'
    };

    const mockUser = { id: 'admin-456' };

    it('should create invitation successfully', async () => {
      const mockInvitation = {
        id: 'inv-001',
        organization_id: 'org-123',
        organization_type: 'school',
        email: 'teacher@school.com',
        member_type: 'educator',
        invited_by: 'admin-456',
        auto_assign_subscription: true,
        target_license_pool_id: 'pool-001',
        status: 'pending',
        invitation_token: 'abc123xyz',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        invitation_message: 'Welcome to our school!',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      } as any);

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // Check for existing invitation
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          } as any;
        }
        // Create invitation
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockInvitation, error: null })
        } as any;
      });

      const result = await service.inviteMember(mockInviteRequest);

      expect(result).toBeDefined();
      expect(result.email).toBe('teacher@school.com');
      expect(result.status).toBe('pending');
      expect(result.autoAssignSubscription).toBe(true);
    });

    it('should throw error when invitation already exists', async () => {
      const existingInvitation = {
        id: 'existing-inv',
        email: 'teacher@school.com',
        status: 'pending'
      };

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingInvitation, error: null })
      } as any));

      await expect(service.inviteMember(mockInviteRequest))
        .rejects.toThrow('An invitation is already pending for this email');
    });

    it('should throw error when user not authenticated', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      } as any));

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      } as any);

      await expect(service.inviteMember(mockInviteRequest))
        .rejects.toThrow('User not authenticated');
    });

    it('should normalize email to lowercase', async () => {
      const requestWithUppercaseEmail = {
        ...mockInviteRequest,
        email: 'Teacher@School.COM'
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      } as any);

      let insertedData: any = null;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          insert: vi.fn().mockImplementation((data) => {
            insertedData = data;
            return {
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ 
                data: { ...data, id: 'inv-001', invitation_token: 'token123' }, 
                error: null 
              })
            };
          })
        } as any;
      });

      await service.inviteMember(requestWithUppercaseEmail);

      expect(insertedData.email).toBe('teacher@school.com');
    });
  });

  describe('bulkInviteMembers', () => {
    it('should invite multiple members and track results', async () => {
      const requests: InviteMemberRequest[] = [
        {
          organizationId: 'org-123',
          organizationType: 'school',
          email: 'teacher1@school.com',
          memberType: 'educator',
          autoAssignSubscription: false
        },
        {
          organizationId: 'org-123',
          organizationType: 'school',
          email: 'teacher2@school.com',
          memberType: 'educator',
          autoAssignSubscription: false
        }
      ];

      const mockUser = { id: 'admin-456' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      } as any);

      let inviteCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        insert: vi.fn().mockReturnThis()
      } as any));

      // Mock successful invitations
      vi.mocked(supabase.from).mockImplementation(() => {
        inviteCount++;
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => {
            if (inviteCount % 2 === 1) {
              // Check for existing - not found
              return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
            }
            // Insert result
            return Promise.resolve({
              data: {
                id: `inv-${inviteCount}`,
                email: `teacher${Math.ceil(inviteCount / 2)}@school.com`,
                status: 'pending',
                invitation_token: `token-${inviteCount}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              error: null
            });
          }),
          insert: vi.fn().mockReturnThis()
        } as any;
      });

      const result = await service.bulkInviteMembers(requests);

      expect(result).toHaveProperty('successful');
      expect(result).toHaveProperty('failed');
      expect(result.totalSent + result.totalFailed).toBe(requests.length);
    });

    it('should track failed invitations', async () => {
      const requests: InviteMemberRequest[] = [
        {
          organizationId: 'org-123',
          organizationType: 'school',
          email: 'existing@school.com', // Will fail - already exists
          memberType: 'educator',
          autoAssignSubscription: false
        }
      ];

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { id: 'existing-inv' }, // Already exists
          error: null 
        })
      } as any));

      const result = await service.bulkInviteMembers(requests);

      expect(result.totalFailed).toBe(1);
      expect(result.failed[0].email).toBe('existing@school.com');
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation with new token and expiration', async () => {
      const mockInvitation = {
        id: 'inv-001',
        email: 'teacher@school.com',
        status: 'pending',
        invitation_token: 'old-token',
        invitation_message: 'Welcome!'
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Get invitation
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockInvitation, error: null })
          } as any;
        }
        // Update invitation
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null })
        } as any;
      });

      await expect(service.resendInvitation('inv-001'))
        .resolves.not.toThrow();
    });

    it('should throw error when invitation not found', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      } as any));

      await expect(service.resendInvitation('invalid-inv'))
        .rejects.toThrow('Invitation not found');
    });

    it('should throw error when invitation is not pending', async () => {
      const mockInvitation = {
        id: 'inv-001',
        status: 'accepted' // Not pending
      };

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvitation, error: null })
      } as any));

      await expect(service.resendInvitation('inv-001'))
        .rejects.toThrow('Can only resend pending invitations');
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel pending invitation', async () => {
      // Create chainable mock that supports multiple .eq() calls
      const createChainableMock = () => {
        const chainable: any = {};
        chainable.update = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }));
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation(() => createChainableMock());

      await expect(service.cancelInvitation('inv-001'))
        .resolves.not.toThrow();
    });

    it('should throw error on database failure', async () => {
      const createChainableMock = () => {
        const chainable: any = {};
        chainable.update = vi.fn().mockReturnValue(chainable);
        chainable.eq = vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Database error' } })
        }));
        return chainable;
      };

      vi.mocked(supabase.from).mockImplementation(() => createChainableMock());

      await expect(service.cancelInvitation('inv-001'))
        .rejects.toThrow();
    });
  });

  describe('acceptInvitation', () => {
    it('should accept valid invitation and link user to organization', async () => {
      const mockInvitation = {
        id: 'inv-001',
        organization_id: 'org-123',
        organization_type: 'school',
        email: 'teacher@school.com',
        member_type: 'educator',
        invited_by: 'admin-456',
        auto_assign_subscription: false,
        status: 'pending',
        invitation_token: 'valid-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'organization_invitations' && callCount === 1) {
          // Find invitation
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockInvitation, error: null })
          } as any;
        }
        if (table === 'organization_invitations' && callCount === 2) {
          // Update invitation status
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null })
          } as any;
        }
        if (table === 'schools') {
          // Get organization name
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { name: 'Test School' }, error: null })
          } as any;
        }
        // Link user operations
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null })
        } as any;
      });

      const result = await service.acceptInvitation('valid-token', 'user-123');

      expect(result).toBeDefined();
      expect(result.invitation.status).toBe('accepted');
      expect(result.organizationName).toBe('Test School');
    });

    it('should throw error for invalid token', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      } as any));

      await expect(service.acceptInvitation('invalid-token', 'user-123'))
        .rejects.toThrow('Invalid or expired invitation');
    });

    it('should throw error for expired invitation', async () => {
      const expiredInvitation = {
        id: 'inv-001',
        status: 'pending',
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Expired yesterday
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: expiredInvitation, error: null })
          } as any;
        }
        // Update to expired status
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null })
        } as any;
      });

      await expect(service.acceptInvitation('expired-token', 'user-123'))
        .rejects.toThrow('Invitation has expired');
    });

    it('should auto-assign license when configured', async () => {
      const mockInvitation = {
        id: 'inv-001',
        organization_id: 'org-123',
        organization_type: 'school',
        email: 'teacher@school.com',
        member_type: 'educator',
        invited_by: 'admin-456',
        auto_assign_subscription: true,
        target_license_pool_id: 'pool-001',
        status: 'pending',
        invitation_token: 'valid-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const mockAssignment = {
        id: 'assign-001',
        userId: 'user-123',
        status: 'active'
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organization_invitations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockInvitation, error: null }),
            update: vi.fn().mockReturnThis()
          } as any;
        }
        if (table === 'schools') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { name: 'Test School' }, error: null })
          } as any;
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null })
        } as any;
      });

      vi.mocked(licenseManagementService.assignLicense).mockResolvedValue(mockAssignment as any);

      const result = await service.acceptInvitation('valid-token', 'user-123');

      expect(licenseManagementService.assignLicense).toHaveBeenCalledWith(
        'pool-001',
        'user-123',
        'admin-456'
      );
      expect(result.assignedLicense).toBeDefined();
    });
  });

  describe('getPendingInvitations', () => {
    it('should return pending invitations for organization', async () => {
      const mockInvitations = [
        {
          id: 'inv-001',
          organization_id: 'org-123',
          email: 'teacher1@school.com',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'inv-002',
          organization_id: 'org-123',
          email: 'teacher2@school.com',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockInvitations, error: null })
      } as any));

      const result = await service.getPendingInvitations('org-123');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pending');
    });

    it('should return empty array when no pending invitations', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      } as any));

      const result = await service.getPendingInvitations('org-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('getAllInvitations', () => {
    it('should return all invitations with filters', async () => {
      const mockInvitations = [
        { id: 'inv-001', status: 'pending', member_type: 'educator' },
        { id: 'inv-002', status: 'accepted', member_type: 'educator' },
        { id: 'inv-003', status: 'expired', member_type: 'student' }
      ];

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockInvitations, error: null })
      } as any));

      const result = await service.getAllInvitations('org-123', {
        limit: 50
      });

      expect(result).toHaveLength(3);
    });

    it('should filter by status', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null })
      } as any));

      await service.getAllInvitations('org-123', { status: 'pending' });

      expect(supabase.from).toHaveBeenCalledWith('organization_invitations');
    });
  });

  describe('getInvitationByToken', () => {
    it('should return invitation by token', async () => {
      const mockInvitation = {
        id: 'inv-001',
        invitation_token: 'valid-token',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvitation, error: null })
      } as any));

      const result = await service.getInvitationByToken('valid-token');

      expect(result).toBeDefined();
      expect(result?.invitationToken).toBe('valid-token');
    });

    it('should return null when token not found', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      } as any));

      const result = await service.getInvitationByToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('getInvitationStats', () => {
    it('should return correct statistics', async () => {
      const mockInvitations = [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'accepted' },
        { status: 'accepted' },
        { status: 'accepted' },
        { status: 'expired' },
        { status: 'cancelled' }
      ];

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockInvitations, error: null })
      } as any));

      const result = await service.getInvitationStats('org-123');

      expect(result.total).toBe(7);
      expect(result.pending).toBe(2);
      expect(result.accepted).toBe(3);
      expect(result.expired).toBe(1);
      expect(result.cancelled).toBe(1);
      // Acceptance rate: 3 / (3 + 1 + 1) = 60%
      expect(result.acceptanceRate).toBe(60);
    });

    it('should handle zero completed invitations', async () => {
      const mockInvitations = [
        { status: 'pending' },
        { status: 'pending' }
      ];

      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockInvitations, error: null })
      } as any));

      const result = await service.getInvitationStats('org-123');

      expect(result.acceptanceRate).toBe(0);
    });
  });

  describe('expireOldInvitations', () => {
    it('should expire old pending invitations', async () => {
      const expiredInvitations = [
        { id: 'inv-001' },
        { id: 'inv-002' }
      ];

      vi.mocked(supabase.from).mockImplementation(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: expiredInvitations, error: null })
      } as any));

      const result = await service.expireOldInvitations();

      expect(result).toBe(2);
    });

    it('should return 0 when no invitations to expire', async () => {
      vi.mocked(supabase.from).mockImplementation(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      } as any));

      const result = await service.expireOldInvitations();

      expect(result).toBe(0);
    });
  });
});
