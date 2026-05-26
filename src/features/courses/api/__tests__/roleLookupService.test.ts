import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserRole } from '@/entities/user/api/roleLookupService';
import { supabase } from '@/shared/api/supabaseClient';

// Mock supabase
vi.mock('@/shared/api/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('roleLookupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockQuery = (data: any, error: any = null) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error })
  });

  describe('getUserRole', () => {
    it('should return learner role when user is found in learners table', async () => {
      const mockLearner = {
        id: 'learner-123',
        user_id: 'user-123',
        email: 'learner@example.com',
        name: 'John Doe',
        school_id: 'school-1'
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'learners') return createMockQuery(mockLearner) as any;
        return createMockQuery(null) as any;
      });

      const result = await getUserRole('user-123', 'learner@example.com');

      expect(result.role).toBe('learner');
      expect(result.userData?.email).toBe('learner@example.com');
      expect(result.error).toBeUndefined();
    });

    it('should return recruiter role when user is found in recruiters table', async () => {
      const mockRecruiter = {
        id: 'recruiter-123',
        user_id: 'user-123',
        email: 'recruiter@example.com',
        name: 'Jane Smith'
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'recruiters') return createMockQuery(mockRecruiter) as any;
        return createMockQuery(null) as any;
      });

      const result = await getUserRole('user-123', 'recruiter@example.com');

      expect(result.role).toBe('recruiter');
      expect(result.userData?.email).toBe('recruiter@example.com');
    });

    it('should return educator role when user is found in school_educators table', async () => {
      const mockEducator = {
        id: 'educator-123',
        user_id: 'user-123',
        email: 'educator@example.com',
        first_name: 'Alice',
        last_name: 'Johnson',
        school_id: 'school-1'
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'school_educators') return createMockQuery(mockEducator) as any;
        return createMockQuery(null) as any;
      });

      const result = await getUserRole('user-123', 'educator@example.com');

      expect(result.role).toBe('educator');
      expect(result.userData?.name).toBe('Alice Johnson');
    });

    it('should return school_admin role when user is found in users table with admin role', async () => {
      const mockAdmin = {
        id: 'admin-123',
        user_id: 'user-123',
        email: 'admin@example.com',
        name: 'Bob Admin',
        role: 'school_admin'
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'users') return createMockQuery(mockAdmin) as any;
        return createMockQuery(null) as any;
      });

      const result = await getUserRole('user-123', 'admin@example.com');

      expect(result.role).toBe('school_admin');
      expect(result.userData?.email).toBe('admin@example.com');
    });

    it('should return null role when user is not found in any table', async () => {
      // All tables return null
      vi.mocked(supabase.from).mockReturnValue(createMockQuery(null) as any);

      const result = await getUserRole('user-123', 'unknown@example.com');

      expect(result.role).toBeNull();
      expect(result.userData).toBeNull();
      expect(result.error).toBe('Account not properly configured. Contact support');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await getUserRole('user-123', 'test@example.com');

      expect(result.role).toBeNull();
      expect(result.userData).toBeNull();
      expect(result.error).toBe('System error. Please try again');
    });

    it('should return single role when user has only one role', async () => {
      const mockLearner = {
        id: 'learner-123',
        user_id: 'user-123',
        email: 'learner@example.com',
        name: 'John Doe'
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'learners') return createMockQuery(mockLearner) as any;
        return createMockQuery(null) as any;
      });

      const result = await getUserRole('user-123', 'learner@example.com');

      // Verify only one role is returned
      expect(result.role).toBe('learner');
      expect(result.roles).toBeUndefined();
      expect(result.userData).toBeDefined();
    });

    it('should return multiple roles when user has more than one role', async () => {
      const mockLearner = {
        id: 'learner-123',
        user_id: 'user-123',
        email: 'multi@example.com',
        name: 'Multi Role User'
      };

      const mockRecruiter = {
        id: 'recruiter-123',
        user_id: 'user-123',
        email: 'multi@example.com',
        name: 'Multi Role User'
      };

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'learners') return createMockQuery(mockLearner) as any;
        if (table === 'recruiters') return createMockQuery(mockRecruiter) as any;
        return createMockQuery(null) as any;
      });

      const result = await getUserRole('user-123', 'multi@example.com');

      // Verify multiple roles are returned
      expect(result.role).toBeNull();
      expect(result.roles).toBeDefined();
      expect(result.roles?.length).toBe(2);
      expect(result.roles).toContain('learner');
      expect(result.roles).toContain('recruiter');
      expect(result.allUserData).toBeDefined();
      expect(result.allUserData?.length).toBe(2);
    });
  });
});
