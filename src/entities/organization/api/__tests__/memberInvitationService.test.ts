/**
 * Unit Tests for MemberInvitationService
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/shared/model/authStore';
import {
    MemberInvitationService,
    type InviteMemberRequest
} from '../memberInvitationService';

// Mock SSO client
vi.mock('@/shared/api/ssoClient', () => ({
  ssoClient: {
    fetch: vi.fn(),
    getAccessToken: vi.fn(() => 'test-token')
  }
}));

import { ssoClient } from '@/shared/api/ssoClient';

// Mock useAuthStore
vi.mock('@/shared/model/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: { id: 'admin-456' }
    }))
  }
}));

function createMockResponse<T>(data: T, status = 200, ok = true): Response {
  return {
    ok,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(),
    redirected: false,
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: function () { return this; },
    body: null,
    bodyUsed: false,
    type: 'basic',
    url: '',
  } as Response;
}

describe('MemberInvitationService', () => {
  let service: MemberInvitationService;

  beforeEach(() => {
    service = new MemberInvitationService();
    vi.clearAllMocks();
    vi.mocked(useAuthStore.getState).mockReturnValue({ user: { id: 'admin-456' } } as unknown as ReturnType<typeof useAuthStore.getState>);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('inviteMember', () => {
    const mockRequest: InviteMemberRequest = {
      organizationId: 'org-123',
      organizationType: 'school',
      email: 'teacher@school.edu',
      memberType: 'educator',
      autoAssignSubscription: true
    };

    const mockInvitationData = {
      id: 'inv-001',
      organization_id: 'org-123',
      organization_type: 'school',
      invitee_email: 'teacher@school.edu',
      invitee_role: 'educator',
      invited_by: 'admin-456',
      status: 'pending',
      invitation_token: 'token-abc-123',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    it('should create invitation successfully', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockInvitationData }));

      const result = await service.inviteMember(mockRequest);

      expect(result).toBeDefined();
      expect(result.id).toBe('inv-001');
      expect(result.email).toBe('teacher@school.edu');
      expect(result.status).toBe('pending');
    });

    it('should throw error when user not authenticated', async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({ user: null } as unknown as ReturnType<typeof useAuthStore.getState>);

      await expect(service.inviteMember(mockRequest))
        .rejects.toThrow('User not authenticated');
    });
  });

  describe('bulkInviteMembers', () => {
    const mockRequests: InviteMemberRequest[] = [
      {
        organizationId: 'org-123',
        organizationType: 'school',
        email: 'teacher1@school.edu',
        memberType: 'educator',
        autoAssignSubscription: true
      },
      {
        organizationId: 'org-123',
        organizationType: 'school',
        email: 'teacher2@school.edu',
        memberType: 'educator',
        autoAssignSubscription: true
      }
    ];

    it('should process bulk invites and separate success/failure', async () => {
      let callCount = 0;
      vi.mocked(ssoClient.fetch).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return createMockResponse({
            data: {
              id: 'inv-001',
              organization_id: 'org-123',
              organization_type: 'school',
              invitee_email: 'teacher1@school.edu',
              invitee_role: 'educator',
              invited_by: 'admin-456',
              status: 'pending',
              invitation_token: 'token-1',
              expires_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          });
        }
        return createMockResponse({ error: { message: 'Already invited' } }, 400, false);
      });

      const result = await service.bulkInviteMembers(mockRequests);

      expect(result.successful).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.totalSent).toBe(1);
      expect(result.totalFailed).toBe(1);
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation successfully', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ success: true }));

      await expect(service.resendInvitation('inv-001')).resolves.not.toThrow();
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel invitation successfully', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ success: true }));

      await expect(service.cancelInvitation('inv-001')).resolves.not.toThrow();
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation successfully', async () => {
      const mockData = {
        id: 'inv-001',
        organization_id: 'org-123',
        organization_type: 'school',
        invitee_email: 'teacher@school.edu',
        invitee_role: 'educator',
        invited_by: 'admin-456',
        status: 'accepted',
        invitation_token: 'token-abc',
        expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization_name: 'St. Mary School'
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockData }));

      const result = await service.acceptInvitation('token-abc', 'user-789');

      expect(result.invitation.status).toBe('accepted');
      expect(result.organizationName).toBe('St. Mary School');
    });

    it('should throw error for expired invitation', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(
        createMockResponse({ error: { message: 'Invitation has expired' } }, 410, false)
      );

      await expect(service.acceptInvitation('expired-token', 'user-789'))
        .rejects.toThrow('Invitation has expired');
    });

    it('should throw error when invitation not found', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(
        createMockResponse({ error: { message: 'Invalid or expired invitation' } }, 404, false)
      );

      await expect(service.acceptInvitation('invalid-token', 'user-789'))
        .rejects.toThrow('Invalid or expired invitation');
    });

    it('should map auto-assign license flag from accepted invitation', async () => {
      const mockData = {
        id: 'inv-001',
        organization_id: 'org-123',
        organization_type: 'school',
        invitee_email: 'teacher@school.edu',
        invitee_role: 'educator',
        invited_by: 'admin-456',
        license_pool_id: 'pool-001',
        status: 'accepted',
        invitation_token: 'token-abc',
        expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization_name: 'St. Mary School'
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockData }));

      const result = await service.acceptInvitation('token-abc', 'user-789');

      expect(result.invitation.autoAssignSubscription).toBe(true);
      expect(result.invitation.targetLicensePoolId).toBe('pool-001');
    });
  });

  describe('resendInvitation', () => {
    it('should throw error when invitation not found', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(
        createMockResponse({ error: { message: 'Invitation not found' } }, 404, false)
      );

      await expect(service.resendInvitation('inv-invalid'))
        .rejects.toThrow('Invitation not found');
    });
  });

  describe('getPendingInvitations', () => {
    it('should return pending invitations', async () => {
      const mockInvitations = [
        {
          id: 'inv-001',
          organization_id: 'org-123',
          organization_type: 'school',
          invitee_email: 'teacher1@school.edu',
          invitee_role: 'educator',
          invited_by: 'admin-456',
          status: 'pending',
          invitation_token: 'token-1',
          expires_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockInvitations }));

      const result = await service.getPendingInvitations('org-123', 'school');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('teacher1@school.edu');
    });
  });

  describe('getInvitationByToken', () => {
    it('should return invitation by token', async () => {
      const mockInvitation = {
        id: 'inv-001',
        organization_id: 'org-123',
        organization_type: 'school',
        invitee_email: 'teacher1@school.edu',
        invitee_role: 'educator',
        invited_by: 'admin-456',
        status: 'pending',
        invitation_token: 'token-1',
        expires_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockInvitation }));

      const result = await service.getInvitationByToken('token-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('inv-001');
    });

    it('should return null when token not found', async () => {
      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: null }));

      const result = await service.getInvitationByToken('token-invalid');

      expect(result).toBeNull();
    });
  });

  describe('getInvitationStats', () => {
    it('should return invitation statistics', async () => {
      const mockStats = {
        total: 10,
        pending: 3,
        accepted: 6,
        expired: 1,
        cancelled: 0,
        acceptanceRate: 60
      };

      vi.mocked(ssoClient.fetch).mockResolvedValue(createMockResponse({ data: mockStats }));

      const result = await service.getInvitationStats('org-123');

      expect(result.total).toBe(10);
      expect(result.acceptanceRate).toBe(60);
    });
  });
});
