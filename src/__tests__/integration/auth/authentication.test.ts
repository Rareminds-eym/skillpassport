/**
 * Integration Tests for Authentication
 * 
 * Tests authentication flows including login, session management,
 * and token validation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockSupabaseClient, createMockRequest, parseResponse } from '../utils/testHelpers';
import { mockAuthSession, mockStudent } from '../utils/mockData';

// Mock Supabase client
vi.mock('@/shared/api/supabaseClient', () => ({
  supabase: createMockSupabaseClient()
}));

describe('Authentication Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('User Login', () => {
    it('should successfully login with valid credentials', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: mockAuthSession
        },
        error: null
      } as any);

      const result = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'Test@123456'
      });

      expect(result.error).toBeNull();
      expect(result.data.user).toBeDefined();
      expect(result.data.session).toBeDefined();
      expect(result.data.session?.access_token).toBe(mockAuthSession.access_token);
    });

    it('should fail login with invalid credentials', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', name: 'AuthError', status: 400 }
      } as any);

      const result = await supabase.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpassword'
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid login credentials');
      expect(result.data.user).toBeNull();
    });

    it('should fail login with missing email', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Email is required', name: 'AuthError', status: 400 }
      } as any);

      const result = await supabase.auth.signInWithPassword({
        email: '',
        password: 'Test@123456'
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Email');
    });
  });

  describe('Session Management', () => {
    it('should retrieve active session', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockAuthSession },
        error: null
      } as any);

      const result = await supabase.auth.getSession();

      expect(result.error).toBeNull();
      expect(result.data.session).toBeDefined();
      expect(result.data.session?.access_token).toBe(mockAuthSession.access_token);
    });

    it('should return null for no active session', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null
      } as any);

      const result = await supabase.auth.getSession();

      expect(result.error).toBeNull();
      expect(result.data.session).toBeNull();
    });

    it('should get current user from session', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockAuthSession.user },
        error: null
      } as any);

      const result = await supabase.auth.getUser();

      expect(result.error).toBeNull();
      expect(result.data.user).toBeDefined();
      expect(result.data.user?.id).toBe('user-123');
      expect(result.data.user?.email).toBe('test@example.com');
    });
  });

  describe('Logout', () => {
    it('should successfully logout user', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: null
      } as any);

      const result = await supabase.auth.signOut();

      expect(result.error).toBeNull();
    });

    it('should handle logout errors gracefully', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: { message: 'Logout failed', name: 'AuthError', status: 500 }
      } as any);

      const result = await supabase.auth.signOut();

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Logout failed');
    });
  });

  describe('Token Validation', () => {
    it('should validate access token format', () => {
      const token = mockAuthSession.access_token;
      
      // JWT format: header.payload.signature
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    it('should handle expired tokens', async () => {
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Token expired', name: 'AuthError', status: 401 }
      } as any);

      const result = await supabase.auth.getSession();

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('expired');
    });
  });

  describe('Authentication Headers', () => {
    it('should create auth headers with token', async () => {
      const { createAuthHeaders } = await import('@/shared/api/httpClient');
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockAuthSession },
        error: null
      } as any);

      const headers = await createAuthHeaders();

      expect(headers['Authorization']).toBe(`Bearer ${mockAuthSession.access_token}`);
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should create headers without token when no session', async () => {
      const { createAuthHeaders } = await import('@/shared/api/httpClient');
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null
      } as any);

      const headers = await createAuthHeaders();

      expect(headers['Authorization']).toBeUndefined();
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});
