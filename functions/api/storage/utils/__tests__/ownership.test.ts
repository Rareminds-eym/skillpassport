/**
 * Unit tests for Ownership Validation Utilities
 * Tests ownership validation functions for different file path patterns
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractUserIdFromPath,
  validateCertificateOwnership,
  validatePaymentReceiptOwnership,
  validateUploadOwnership,
  isEducator,
} from '../ownership';

describe('Ownership Validation Utilities', () => {
  describe('extractUserIdFromPath', () => {
    it('should extract user ID from certificate path', () => {
      const userId = extractUserIdFromPath('certificates/user-123/certificate.pdf');
      expect(userId).toBe('user-123');
    });

    it('should extract user ID from payment receipt path', () => {
      const userId = extractUserIdFromPath('payment_pdf/receipt_user-456/payment.pdf');
      expect(userId).toBe('user-456');
    });

    it('should extract user ID from upload path', () => {
      const userId = extractUserIdFromPath('uploads/user-789/document.pdf');
      expect(userId).toBe('user-789');
    });

    it('should return null for unrecognized path pattern', () => {
      const userId = extractUserIdFromPath('courses/course-123/material.pdf');
      expect(userId).toBeNull();
    });

    it('should return null for empty path', () => {
      const userId = extractUserIdFromPath('');
      expect(userId).toBeNull();
    });

    it('should handle UUID format user IDs', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const userId = extractUserIdFromPath(`uploads/${uuid}/file.pdf`);
      expect(userId).toBe(uuid);
    });
  });

  describe('validateCertificateOwnership', () => {
    it('should validate ownership when user ID matches', () => {
      const result = validateCertificateOwnership(
        'certificates/user-123/certificate.pdf',
        'user-123'
      );
      expect(result.isOwner).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject ownership when user ID does not match', () => {
      const result = validateCertificateOwnership(
        'certificates/user-123/certificate.pdf',
        'user-456'
      );
      expect(result.isOwner).toBe(false);
      expect(result.reason).toBe('User ID does not match certificate owner');
    });

    it('should reject when user ID cannot be extracted', () => {
      const result = validateCertificateOwnership(
        'invalid/path/certificate.pdf',
        'user-123'
      );
      expect(result.isOwner).toBe(false);
      expect(result.reason).toBe('Could not extract student ID from certificate path');
    });
  });

  describe('validatePaymentReceiptOwnership', () => {
    it('should validate ownership when user ID matches', () => {
      const result = validatePaymentReceiptOwnership(
        'payment_pdf/receipt_user-123/payment.pdf',
        'user-123'
      );
      expect(result.isOwner).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject ownership when user ID does not match', () => {
      const result = validatePaymentReceiptOwnership(
        'payment_pdf/receipt_user-123/payment.pdf',
        'user-456'
      );
      expect(result.isOwner).toBe(false);
      expect(result.reason).toBe('User ID does not match payment receipt owner');
    });

    it('should reject when user ID cannot be extracted', () => {
      const result = validatePaymentReceiptOwnership(
        'invalid/path/payment.pdf',
        'user-123'
      );
      expect(result.isOwner).toBe(false);
      expect(result.reason).toBe('Could not extract user ID from payment receipt path');
    });
  });

  describe('validateUploadOwnership', () => {
    it('should validate ownership when user ID matches', () => {
      const result = validateUploadOwnership(
        'uploads/user-123/document.pdf',
        'user-123'
      );
      expect(result.isOwner).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should reject ownership when user ID does not match', () => {
      const result = validateUploadOwnership(
        'uploads/user-123/document.pdf',
        'user-456'
      );
      expect(result.isOwner).toBe(false);
      expect(result.reason).toBe('User ID does not match upload owner');
    });

    it('should reject when user ID cannot be extracted', () => {
      const result = validateUploadOwnership(
        'invalid/path/document.pdf',
        'user-123'
      );
      expect(result.isOwner).toBe(false);
      expect(result.reason).toBe('Could not extract user ID from upload path');
    });
  });

  describe('isEducator', () => {
    let mockSupabase: any;

    beforeEach(() => {
      mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };
    });

    it('should return true when user is an active educator', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'educator-id' },
        error: null,
      });

      const result = await isEducator('user-123', mockSupabase);

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('school_educators');
      expect(mockSupabase.select).toHaveBeenCalledWith('id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabase.eq).toHaveBeenCalledWith('account_status', 'active');
    });

    it('should return false when user is not an educator', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const result = await isEducator('user-456', mockSupabase);

      expect(result).toBe(false);
    });

    it('should return false when database query fails', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' },
      });

      const result = await isEducator('user-789', mockSupabase);

      expect(result).toBe(false);
    });

    it('should return false when exception occurs', async () => {
      mockSupabase.single.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await isEducator('user-999', mockSupabase);

      expect(result).toBe(false);
    });
  });
});
