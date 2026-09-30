import { describe, it, expect, vi, beforeEach } from 'vitest';
import { organizationMemberService } from '../organizationMemberService';
import { apiGet } from '@/shared/api/apiClient';

vi.mock('@/shared/api/apiClient', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

describe('OrganizationMemberService - License Assignment Enrichment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enrich members with active license assignments from getLicensedMembers endpoint', async () => {
    // 1. Mock getLearners response
    vi.mocked(apiGet).mockImplementation(async (url: string): Promise<{ data: any }> => {
      if (url.includes('action=getLearners')) {
        return {
          data: {
            members: [
              {
                id: 'learner-1',
                user_id: 'user-7858e5c2',
                name: 'Harikrishna Pradeeep',
                email: '7858e5c2@dismail.top',
                approval_status: 'active',
              },
            ],
            total: 1,
          },
        };
      }
      if (url.includes('action=getEducators')) {
        return {
          data: { members: [], total: 0 },
        };
      }
      if (url.includes('action=getLicensedMembers')) {
        return {
          data: {
            assignments: [
              {
                id: 'assignment-101',
                user_id: 'user-7858e5c2',
                license_pool_id: 'pool-alpha',
                assigned_at: '2026-08-29T00:00:00.000Z',
              },
            ],
            poolMap: {
              'pool-alpha': 'Alpha Pool',
            },
          },
        };
      }
      return { data: null };
    });

    const result = await organizationMemberService.fetchOrganizationMembers({
      organizationId: 'org-college-1',
      organizationType: 'college',
      includeAssignmentStatus: true,
    });

    expect(result.members).toHaveLength(1);
    const member = result.members[0];
    expect(member.name).toBe('Harikrishna Pradeeep');
    expect(member.hasLicense).toBe(true);
    expect(member.poolName).toBe('Alpha Pool');
    expect(member.licenseAssignmentId).toBe('assignment-101');
  });
});
