import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserRole } from '@/entities/user/api/roleLookupService';
import { apiPost } from '@/shared/api/apiClient';

vi.mock('@/shared/api/apiClient', () => ({
  apiPost: vi.fn(),
}));

describe('roleLookupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserRole', () => {
    it('should return learner role when function resolves learner', async () => {
      vi.mocked(apiPost).mockResolvedValue({
        data: {
          role: 'learner',
          userData: { id: 'learner-123', email: 'learner@example.com' },
        },
      });

      const result = await getUserRole('user-123', 'learner@example.com');

      expect(result.role).toBe('learner');
      expect(result.userData?.email).toBe('learner@example.com');
      expect(result.error).toBeUndefined();
    });

    it('should return recruiter role when function resolves recruiter', async () => {
      vi.mocked(apiPost).mockResolvedValue({
        data: {
          role: 'recruiter',
          userData: { id: 'recruiter-123', email: 'recruiter@example.com' },
        },
      });

      const result = await getUserRole('user-123', 'recruiter@example.com');

      expect(result.role).toBe('recruiter');
      expect(result.userData?.email).toBe('recruiter@example.com');
    });

    it('should return educator role when function resolves educator', async () => {
      vi.mocked(apiPost).mockResolvedValue({
        data: {
          role: 'educator',
          userData: { id: 'educator-123', email: 'educator@example.com', name: 'Alice Johnson' },
        },
      });

      const result = await getUserRole('user-123', 'educator@example.com');

      expect(result.role).toBe('educator');
      expect(result.userData?.name).toBe('Alice Johnson');
    });

    it('should return school_admin role when function resolves school_admin', async () => {
      vi.mocked(apiPost).mockResolvedValue({
        data: {
          role: 'school_admin',
          userData: { id: 'admin-123', email: 'admin@example.com' },
        },
      });

      const result = await getUserRole('user-123', 'admin@example.com');

      expect(result.role).toBe('school_admin');
      expect(result.userData?.email).toBe('admin@example.com');
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(apiPost).mockRejectedValue(new Error('Network error'));

      const result = await getUserRole('user-123', 'unknown@example.com');

      expect(result.role).toBeNull();
      expect(result.userData).toBeNull();
      expect(result.error).toBe('System error. Please try again');
    });
  });
});
