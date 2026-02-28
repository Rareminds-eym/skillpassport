/**
 * Error Handling Utilities Tests
 * 
 * Tests for standardized error responses and logging
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ERROR_MESSAGES,
  createAuthenticationError,
  createAuthorizationError,
  sanitizeErrorMessage,
  logAuthenticationFailure,
  logAuthorizationFailure,
  logErrorSafely,
} from '../error-handling';

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    // Clear console mocks before each test
    vi.clearAllMocks();
  });

  describe('ERROR_MESSAGES', () => {
    it('should have all required error messages', () => {
      expect(ERROR_MESSAGES.AUTHENTICATION_REQUIRED).toBe('Authentication required');
      expect(ERROR_MESSAGES.ACCESS_DENIED).toBe('Access denied');
      expect(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS).toBe('You do not have permission to access this resource');
    });
  });

  describe('createAuthenticationError', () => {
    it('should return 401 response with standard error message', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = createAuthenticationError('/upload', 'missing_token');
      
      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body.error).toBe('Authentication required');
      expect(body.message).toBe('Please provide a valid JWT token in the Authorization header');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Auth] Authentication failed:',
        expect.objectContaining({
          endpoint: '/upload',
          reason: 'missing_token',
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should accept custom message', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = createAuthenticationError('/upload', 'expired_token', 'Token has expired');
      
      const body = await response.json();
      expect(body.message).toBe('Token has expired');
      
      consoleSpy.mockRestore();
    });
  });

  describe('createAuthorizationError', () => {
    it('should return 403 response with standard error message', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = createAuthorizationError(
        'user-123',
        'uploads/user-456/file.pdf',
        'ownership_mismatch'
      );
      
      expect(response.status).toBe(403);
      
      const body = await response.json();
      expect(body.error).toBe('Access denied');
      expect(body.message).toBe('You do not have permission to access this resource');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Authz] Authorization failed:',
        expect.objectContaining({
          userId: 'user-123',
          fileKey: 'uploads/user-456/file.pdf',
          reason: 'ownership_mismatch',
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should accept custom message', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = createAuthorizationError(
        'user-123',
        'courses/course-1/file.pdf',
        'insufficient_role',
        'Only educators can delete course materials'
      );
      
      const body = await response.json();
      expect(body.message).toBe('Only educators can delete course materials');
      
      consoleSpy.mockRestore();
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should redact JWT tokens', () => {
      const message = 'Error with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const sanitized = sanitizeErrorMessage(message);
      
      expect(sanitized).toContain('Bearer [REDACTED]');
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should redact potential API keys', () => {
      const message = 'Error with API key: sk_test_FAKE1234567890TESTKEY';
      const sanitized = sanitizeErrorMessage(message);
      
      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('FAKE1234567890TESTKEY');
    });

    it('should redact file paths with sensitive info', () => {
      const message = 'Error accessing /user-123/secret-456/file.pdf';
      const sanitized = sanitizeErrorMessage(message);
      
      expect(sanitized).toContain('[PATH]');
    });

    it('should not modify safe messages', () => {
      const message = 'File not found';
      const sanitized = sanitizeErrorMessage(message);
      
      expect(sanitized).toBe(message);
    });
  });

  describe('logAuthenticationFailure', () => {
    it('should log authentication failure with timestamp', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      logAuthenticationFailure('/upload', 'invalid_token');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Auth] Authentication failed:',
        expect.objectContaining({
          endpoint: '/upload',
          reason: 'invalid_token',
          timestamp: expect.any(String),
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('logAuthorizationFailure', () => {
    it('should log authorization failure with timestamp', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      logAuthorizationFailure('user-123', 'uploads/user-456/file.pdf', 'ownership_mismatch');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Authz] Authorization failed:',
        expect.objectContaining({
          userId: 'user-123',
          fileKey: 'uploads/user-456/file.pdf',
          reason: 'ownership_mismatch',
          timestamp: expect.any(String),
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('logErrorSafely', () => {
    it('should log error with sanitized message', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const error = new Error('Error with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature');
      logErrorSafely('Upload', error);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Upload] Error:',
        expect.objectContaining({
          message: expect.stringContaining('[REDACTED]'),
          timestamp: expect.any(String),
        })
      );
      
      const call = consoleSpy.mock.calls[0][1] as any;
      expect(call.message).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      
      consoleSpy.mockRestore();
    });

    it('should handle non-Error objects', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      logErrorSafely('Upload', 'String error message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Upload] Error:',
        expect.objectContaining({
          message: 'String error message',
          timestamp: expect.any(String),
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error response format consistency', () => {
    it('should ensure 401 responses have consistent format', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = createAuthenticationError('/upload', 'missing_token');
      const body = await response.json();
      
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(typeof body.error).toBe('string');
      expect(typeof body.message).toBe('string');
      
      consoleSpy.mockRestore();
    });

    it('should ensure 403 responses have consistent format', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const response = createAuthorizationError('user-123', 'file.pdf', 'ownership_mismatch');
      const body = await response.json();
      
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(typeof body.error).toBe('string');
      expect(typeof body.message).toBe('string');
      
      consoleSpy.mockRestore();
    });
  });
});
