/**
 * Integration tests for Storage API Authentication
 * Tests complete flows including authentication, authorization, and ownership validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const STORAGE_API_URL = process.env.STORAGE_API_URL || 'http://localhost:8788/api/storage';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Test users
const testUsers = {
  user1: {
    email: 'test-user-1@example.com',
    password: 'TestPassword123!',
    id: '',
    token: ''
  },
  user2: {
    email: 'test-user-2@example.com',
    password: 'TestPassword123!',
    id: '',
    token: ''
  }
};

describe('Storage API Integration Tests', () => {
  let supabase: any;
  let uploadedFileUrl: string;
  let uploadedFileKey: string;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Sign in test users and get tokens
    for (const [key, user] of Object.entries(testUsers)) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (error) {
        console.warn(`Could not sign in ${user.email}, tests may be limited`);
      } else {
        user.id = data.user.id;
        user.token = data.session.access_token;
      }
    }
  });

  afterAll(async () => {
    // Clean up: sign out users
    await supabase.auth.signOut();
  });

  describe('Public Endpoints', () => {
    it('should allow access to health check without authentication', async () => {
      const response = await fetch(`${STORAGE_API_URL}/`);
      expect(response.status).toBe(200);
    });

    it('should allow access to /course-certificate without authentication', async () => {
      const response = await fetch(`${STORAGE_API_URL}/course-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: 'test-student' })
      });
      
      // Should not return 401 (may return other errors if data doesn't exist)
      expect(response.status).not.toBe(401);
    });

    it('should allow access to /extract-content without authentication', async () => {
      const response = await fetch(`${STORAGE_API_URL}/extract-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/test.pdf' })
      });
      
      // Should not return 401 (may return other errors)
      expect(response.status).not.toBe(401);
    });
  });

  describe('Authentication - Upload Flow', () => {
    it('should reject upload without authentication token', async () => {
      const formData = new FormData();
      const testFile = new Blob(['test content'], { type: 'text/plain' });
      formData.append('file', testFile, 'test.txt');

      const response = await fetch(`${STORAGE_API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Authentication required');
    });

    it('should reject upload with invalid token', async () => {
      const formData = new FormData();
      const testFile = new Blob(['test content'], { type: 'text/plain' });
      formData.append('file', testFile, 'test.txt');

      const response = await fetch(`${STORAGE_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-token-12345'
        },
        body: formData
      });

      expect(response.status).toBe(401);
    });

    it('should accept upload with valid authentication token', async () => {
      if (!testUsers.user1.token) {
        console.warn('Skipping test: user1 token not available');
        return;
      }

      const formData = new FormData();
      const testFile = new Blob(['test content for integration'], { type: 'text/plain' });
      formData.append('file', testFile, 'integration-test.txt');

      const response = await fetch(`${STORAGE_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUsers.user1.token}`
        },
        body: formData
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.url).toBeDefined();
      expect(data.key).toContain(testUsers.user1.id);

      // Store for later tests
      uploadedFileUrl = data.url;
      uploadedFileKey = data.key;
    });

    it('should include user ID in uploaded file path', async () => {
      if (!testUsers.user1.token) {
        console.warn('Skipping test: user1 token not available');
        return;
      }

      const formData = new FormData();
      const testFile = new Blob(['test content'], { type: 'text/plain' });
      formData.append('file', testFile, 'path-test.txt');

      const response = await fetch(`${STORAGE_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUsers.user1.token}`
        },
        body: formData
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.key).toMatch(new RegExp(`uploads/${testUsers.user1.id}/`));
    });
  });

  describe('Authorization - Delete Flow with Ownership Validation', () => {
    it('should reject delete without authentication token', async () => {
      const response = await fetch(`${STORAGE_API_URL}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/test.txt' })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Authentication required');
    });

    it('should allow user to delete their own file', async () => {
      if (!testUsers.user1.token || !uploadedFileKey) {
        console.warn('Skipping test: prerequisites not met');
        return;
      }

      const response = await fetch(`${STORAGE_API_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUsers.user1.token}`
        },
        body: JSON.stringify({ key: uploadedFileKey })
      });

      // Should succeed (200) or file not found (404), but not forbidden
      expect([200, 404]).toContain(response.status);
    });

    it('should reject user deleting another user\'s file', async () => {
      if (!testUsers.user2.token || !testUsers.user1.id) {
        console.warn('Skipping test: user tokens not available');
        return;
      }

      // Try to delete user1's file with user2's token
      const otherUserFileKey = `uploads/${testUsers.user1.id}/test-file.txt`;

      const response = await fetch(`${STORAGE_API_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUsers.user2.token}`
        },
        body: JSON.stringify({ key: otherUserFileKey })
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Access denied');
    });

    it('should validate ownership for certificate deletion', async () => {
      if (!testUsers.user2.token || !testUsers.user1.id) {
        console.warn('Skipping test: user tokens not available');
        return;
      }

      // Try to delete user1's certificate with user2's token
      const certificateKey = `certificates/${testUsers.user1.id}/certificate.pdf`;

      const response = await fetch(`${STORAGE_API_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUsers.user2.token}`
        },
        body: JSON.stringify({ key: certificateKey })
      });

      expect(response.status).toBe(403);
    });

    it('should validate ownership for payment receipt deletion', async () => {
      if (!testUsers.user2.token || !testUsers.user1.id) {
        console.warn('Skipping test: user tokens not available');
        return;
      }

      // Try to delete user1's payment receipt with user2's token
      const paymentKey = `payment_pdf/receipt_${testUsers.user1.id}/payment.pdf`;

      const response = await fetch(`${STORAGE_API_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUsers.user2.token}`
        },
        body: JSON.stringify({ key: paymentKey })
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Authorization - Payment Receipt Access', () => {
    it('should reject payment receipt access without authentication', async () => {
      const response = await fetch(`${STORAGE_API_URL}/payment-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: 'test-payment-id' })
      });

      expect(response.status).toBe(401);
    });

    it('should validate ownership for payment receipt access', async () => {
      if (!testUsers.user1.token) {
        console.warn('Skipping test: user1 token not available');
        return;
      }

      // Try to access a payment receipt
      const response = await fetch(`${STORAGE_API_URL}/payment-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUsers.user1.token}`
        },
        body: JSON.stringify({ paymentId: 'test-payment-id' })
      });

      // Should return 404 (not found) or 403 (forbidden), but not 401
      expect(response.status).not.toBe(401);
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Authorization - Presigned URL Flow', () => {
    it('should reject presigned URL request without authentication', async () => {
      const response = await fetch(`${STORAGE_API_URL}/presigned`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filename: 'test.pdf',
          courseId: 'course-1',
          lessonId: 'lesson-1'
        })
      });

      expect(response.status).toBe(401);
    });

    it('should generate presigned URL with user ID in path', async () => {
      if (!testUsers.user1.token) {
        console.warn('Skipping test: user1 token not available');
        return;
      }

      const response = await fetch(`${STORAGE_API_URL}/presigned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUsers.user1.token}`
        },
        body: JSON.stringify({ 
          filename: 'test.pdf',
          courseId: 'course-1',
          lessonId: 'lesson-1'
        })
      });

      if (response.status === 200) {
        const data = await response.json();
        expect(data.key).toContain(testUsers.user1.id);
      }
    });

    it('should reject upload confirmation for another user\'s file', async () => {
      if (!testUsers.user2.token || !testUsers.user1.id) {
        console.warn('Skipping test: user tokens not available');
        return;
      }

      // Try to confirm upload for user1's file with user2's token
      const fileKey = `courses/course-1/lesson-1/${testUsers.user1.id}/test.pdf`;

      const response = await fetch(`${STORAGE_API_URL}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUsers.user2.token}`
        },
        body: JSON.stringify({ fileKey })
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Error Handling', () => {
    it('should return clear error message for missing authentication', async () => {
      const response = await fetch(`${STORAGE_API_URL}/upload`, {
        method: 'POST',
        body: new FormData()
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.toLowerCase()).toContain('authentication');
    });

    it('should return clear error message for authorization failure', async () => {
      if (!testUsers.user2.token || !testUsers.user1.id) {
        console.warn('Skipping test: user tokens not available');
        return;
      }

      const otherUserFileKey = `uploads/${testUsers.user1.id}/test.txt`;

      const response = await fetch(`${STORAGE_API_URL}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUsers.user2.token}`
        },
        body: JSON.stringify({ key: otherUserFileKey })
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.toLowerCase()).toMatch(/access denied|forbidden|permission/);
    });

    it('should handle expired tokens appropriately', async () => {
      // Use a clearly expired/invalid token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const response = await fetch(`${STORAGE_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        },
        body: new FormData()
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Frontend Service Token Integration', () => {
    it('should verify tokens are included in requests from frontend services', async () => {
      if (!testUsers.user1.token) {
        console.warn('Skipping test: user1 token not available');
        return;
      }

      // Simulate frontend service behavior
      const formData = new FormData();
      const testFile = new Blob(['frontend test'], { type: 'text/plain' });
      formData.append('file', testFile, 'frontend-test.txt');

      const response = await fetch(`${STORAGE_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testUsers.user1.token}`
        },
        body: formData
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});
