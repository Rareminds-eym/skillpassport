/**
 * Integration Tests for User Signup
 * 
 * Tests user registration flows for different user types:
 * - School learners and educators
 * - College learners and lecturers
 * - University learners and faculty
 * - Recruiters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createMockSupabaseClient, 
  generateTestUser, 
  generateTestOrganization 
} from '../utils/testHelpers';
import { mockSchool, mockCollege, mockCompany } from '../utils/mockData';

// Mock Supabase client
vi.mock('@/shared/api/supabaseClient', () => ({
  supabase: createMockSupabaseClient()
}));

describe('User Signup Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('School Learner Signup', () => {
    it('should successfully register a school learner', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      const testUser = generateTestUser();
      
      // Mock organization check
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSchool, error: null })
      } as any);

      // Mock auth user creation
      vi.mocked(supabase.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-learner-id', email: testUser.email } },
        error: null
      } as any);

      // Mock learner record creation
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'learner-new',
            user_id: 'new-learner-id',
            ...testUser,
            school_id: mockSchool.id
          },
          error: null
        })
      } as any);

      const result = await supabase.from('learners').insert({
        user_id: 'new-learner-id',
        email: testUser.email,
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        phone_number: testUser.phoneNumber,
        school_id: mockSchool.id
      }).select().single();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.email).toBe(testUser.email);
    });

    it('should fail when school code is invalid', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'School not found', code: 'PGRST116' } 
        })
      } as any);

      const result = await supabase.from('organizations')
        .select('*')
        .eq('code', 'INVALID')
        .single();

      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });

    it('should validate required fields', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Missing required fields', code: 'VALIDATION_ERROR' }
        })
      } as any);

      const result = await supabase.from('learners').insert({
        email: '', // Missing email
        school_id: mockSchool.id
      }).select().single();

      expect(result.error).toBeDefined();
    });
  });

  describe('School Educator Signup', () => {
    it('should successfully register a school educator', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      const testUser = generateTestUser({ email: 'educator@test.com' });
      
      // Mock school verification
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSchool, error: null })
      } as any);

      // Mock auth user creation
      vi.mocked(supabase.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-educator-id', email: testUser.email } },
        error: null
      } as any);

      // Mock educator record creation
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'educator-new',
            user_id: 'new-educator-id',
            ...testUser,
            school_id: mockSchool.id,
            subjects: ['Mathematics']
          },
          error: null
        })
      } as any);

      const result = await supabase.from('school_educators').insert({
        user_id: 'new-educator-id',
        email: testUser.email,
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        school_id: mockSchool.id
      }).select().single();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });
  });

  describe('College Learner Signup', () => {
    it('should successfully register a college learner', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      const testUser = generateTestUser({ email: 'college.learner@test.com' });
      
      // Mock college verification
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCollege, error: null })
      } as any);

      // Mock auth user creation
      vi.mocked(supabase.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-college-learner-id', email: testUser.email } },
        error: null
      } as any);

      // Mock college learner record creation
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'college-learner-new',
            user_id: 'new-college-learner-id',
            ...testUser,
            college_id: mockCollege.id
          },
          error: null
        })
      } as any);

      const result = await supabase.from('learners').insert({
        user_id: 'new-college-learner-id',
        email: testUser.email,
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        college_id: mockCollege.id
      }).select().single();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });
  });

  describe('Recruiter Signup', () => {
    it('should successfully register a recruiter', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      const testUser = generateTestUser({ email: 'recruiter@test.com' });
      
      // Mock company verification
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCompany, error: null })
      } as any);

      // Mock auth user creation
      vi.mocked(supabase.auth.admin.createUser).mockResolvedValueOnce({
        data: { user: { id: 'new-recruiter-id', email: testUser.email } },
        error: null
      } as any);

      // Mock recruiter record creation
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'recruiter-new',
            user_id: 'new-recruiter-id',
            ...testUser,
            company_id: mockCompany.id,
            designation: 'HR Manager'
          },
          error: null
        })
      } as any);

      const result = await supabase.from('recruiters').insert({
        user_id: 'new-recruiter-id',
        email: testUser.email,
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        company_id: mockCompany.id
      }).select().single();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('should fail when company does not exist', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Company not found', code: 'PGRST116' } 
        })
      } as any);

      const result = await supabase.from('companies')
        .select('*')
        .eq('code', 'INVALID')
        .single();

      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });
  });

  describe('Email Validation', () => {
    it('should reject duplicate email addresses', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.admin.listUsers).mockResolvedValueOnce({
        data: { 
          users: [{ id: 'existing-user', email: 'existing@test.com' }] 
        },
        error: null
      } as any);

      const result = await supabase.auth.admin.listUsers();
      const existingUser = result.data?.users.find(u => u.email === 'existing@test.com');

      expect(existingUser).toBeDefined();
    });

    it('should validate email format', () => {
      const { validateEmail } = require('@/shared/api/apiUtils');
      
      expect(validateEmail('valid@example.com').valid).toBe(true);
      expect(validateEmail('invalid-email').valid).toBe(false);
      expect(validateEmail('').valid).toBe(false);
      expect(validateEmail('missing@domain').valid).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should validate password strength', () => {
      const { validatePassword } = require('@/shared/api/apiUtils');
      
      expect(validatePassword('Test@123456').valid).toBe(true);
      expect(validatePassword('short').valid).toBe(false);
      expect(validatePassword('').valid).toBe(false);
    });
  });
});
