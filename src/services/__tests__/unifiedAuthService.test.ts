import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn, signOut, resetPassword, updatePassword } from '../unifiedAuthService';
import { supabase } from '../../lib/supabaseClient';

// Mock supabase
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    }
  }
}));

describe('unifiedAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should return success with user data on valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { role: 'student' }
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null
      } as any);

      const result = await signIn('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('test@example.com');
      expect(result.error).toBeUndefined();
    });

    it('should return error on invalid credentials', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      } as any);

      const result = await signIn('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should return error when email or password is empty', async () => {
      const result1 = await signIn('', 'password');
      expect(result1.success).toBe(false);
      expect(result1.error).toBe('Email and password are required');

      const result2 = await signIn('test@example.com', '');
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Email and password are required');
    });

    it('should handle unverified email error', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' }
      } as any);

      const result = await signIn('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please verify your email address');
    });
  });

  describe('signOut', () => {
    it('should return success on successful sign out', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null
      } as any);

      const result = await signOut();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error on sign out failure', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: { message: 'Sign out failed' }
      } as any);

      const result = await signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign out failed');
    });
  });

  describe('resetPassword', () => {
    it('should return success when reset email is sent', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null
      } as any);

      const result = await resetPassword('test@example.com');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error when email is empty', async () => {
      const result = await resetPassword('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should return error on failure', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: null,
        error: { message: 'Failed to send email' }
      } as any);

      const result = await resetPassword('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send reset email. Please try again');
    });
  });

  describe('updatePassword', () => {
    it('should return success when password is updated', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: {} },
        error: null
      } as any);

      const result = await updatePassword('newpassword123');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error when password is empty', async () => {
      const result = await updatePassword('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should return error on update failure', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Update failed' }
      } as any);

      const result = await updatePassword('newpassword123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update password');
    });
  });
});
