import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserRole } from '../roleLookupService';
import { supabase } from '../../lib/supabaseClient';

// Mock supabase
vi.mock('../../lib/supabaseClient', () => ({
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
    it('should return student role when user is found in students table', async () => {
      const mockStudent = {
        id: 'student-123',
        user_id: 'user-123',
        email: 'student@example.com',
        name: 'John Doe',
        school_id: 'school-1'
      };

      vi.mocked(supabase.from).mockReturnValue(createMockQuery(mockStudent) as any);

      const result = await getUserRole('user-123', 'student@example.com');

      expect(result.role).toBe('student');
      expect(result.userData?.email).toBe('student@example.com');
      expect(result.error).toBeUndefined();
    });

    it('should return recruiter role when user is found in recruiters table', async () => {
      const mockRecruiter = {
        id: 'recruiter-123',
        user_id: 'user-123',
        email: 'recruiter@example.com',
        name: 'Jane Smith'
      };

      // First call (students) returns null, second call (recruiters) returns data
      vi.mocked(supabase.from)
        .mockReturnValueOnce(createMockQuery(null) as any)
        .mockReturnValueOnce(createMockQuery(mockRecruiter) as any);

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

      // Students and recruiters return null, school_educators returns data
      vi.mocked(supabase.from)
        .mockReturnValueOnce(createMockQuery(null) as any)
        .mockReturnValueOnce(createMockQuery(null) as any)
        .mockReturnValueOnce(createMockQuery(mockEducator) as any);

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

      // All previous tables return null, users table returns admin
      vi.mocked(supabase.from)
        .mockReturnValueOnce(createMockQuery(null) as any)
        .mockReturnValueOnce(createMockQuery(null) as any)
        .mockReturnValueOnce(createMockQuery(null) as any)
        .mockReturnValueOnce(createMockQuery(null) as any)
        .mockReturnValueOnce(createMockQuery(mockAdmin) as any);

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
      const mockError = { message: 'Database connection failed' };
      
      vi.mocked(supabase.from).mockReturnValue(
        createMockQuery(null, mockError) as any
      );

      const result = await getUserRole('user-123', 'test@example.com');

      expect(result.role).toBeNull();
      expect(result.userData).toBeNull();
      expect(result.error).toBe('System error. Please try again');
    });

    it('should return single role when user has only one role', async () => {
      const mockStudent = {
        id: 'student-123',
        user_id: 'user-123',
        email: 'student@example.com',
        name: 'John Doe'
      };

      vi.mocked(supabase.from).mockReturnValue(createMockQuery(mockStudent) as any);

      const result = await getUserRole('user-123', 'student@example.com');

      // Verify only one role is returned
      expect(result.role).toBe('student');
      expect(result.roles).toBeUndefined();
      expect(result.userData).toBeDefined();
    });

    it('should return multiple roles when user has more than one role', async () => {
      const mockStudent = {
        id: 'student-123',
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

      // First call (students) returns data, second call (recruiters) returns data
      vi.mocked(supabase.from)
        .mockReturnValueOnce(createMockQuery(mockStudent) as any)
        .mockReturnValueOnce(createMockQuery(mockRecruiter) as any)
        .mockReturnValue(createMockQuery(null) as any);

      const result = await getUserRole('user-123', 'multi@example.com');

      // Verify multiple roles are returned
      expect(result.role).toBeNull();
      expect(result.roles).toBeDefined();
      expect(result.roles?.length).toBe(2);
      expect(result.roles).toContain('student');
      expect(result.roles).toContain('recruiter');
      expect(result.allUserData).toBeDefined();
      expect(result.allUserData?.length).toBe(2);
    });
  });
});
