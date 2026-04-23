/**
 * Integration Tests for File Upload Operations
 * 
 * Tests file upload, download, and deletion operations
 * with R2 storage service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockSupabaseClient, createMockFile } from '../utils/testHelpers';
import { mockFileUploadResponse, mockAuthSession } from '../utils/mockData';

// Mock Supabase client
vi.mock('@/shared/api/supabaseClient', () => ({
  supabase: createMockSupabaseClient()
}));

// Mock fetch for storage API calls
global.fetch = vi.fn();

describe('File Upload Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Single File Upload', () => {
    it('should successfully upload a file', async () => {
      const { uploadFile } = await import('@/shared/api/fileUploadService');
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      // Mock auth session
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockAuthSession },
        error: null
      } as any);

      // Mock fetch response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFileUploadResponse
      } as Response);

      const file = createMockFile('test.pdf', 1024, 'application/pdf');
      const result = await uploadFile(file, 'documents');

      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
      expect(result.filename).toBeDefined();
    });

    it('should fail upload without authentication', async () => {
      const { uploadFile } = await import('@/shared/api/fileUploadService');
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      // Mock no session
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null
      } as any);

      const file = createMockFile();
      const result = await uploadFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });

    it('should handle upload errors', async () => {
      const { uploadFile } = await import('@/shared/api/fileUploadService');
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockAuthSession },
        error: null
      } as any);

      // Mock failed upload
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Upload failed' })
      } as Response);

      const file = createMockFile();
      const result = await uploadFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      const { uploadFile } = await import('@/shared/api/fileUploadService');
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockAuthSession },
        error: null
      } as any);

      // Mock network error
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const file = createMockFile();
      const result = await uploadFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('Multiple File Upload', () => {
    it('should upload multiple files successfully', async () => {
      const { uploadMultipleFiles } = await import('@/shared/api/fileUploadService');
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockAuthSession },
        error: null
      } as any);

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockFileUploadResponse
      } as Response);

      const files = [
        createMockFile('file1.pdf'),
        createMockFile('file2.pdf'),
        createMockFile('file3.pdf')
      ];

      const results = await uploadMultipleFiles(files);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle partial upload failures', async () => {
      const { uploadMultipleFiles } = await import('@/shared/api/fileUploadService');
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockAuthSession },
        error: null
      } as any);

      // First upload succeeds, second fails
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFileUploadResponse
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Upload failed' })
        } as Response);

      const files = [
        createMockFile('file1.pdf'),
        createMockFile('file2.pdf')
      ];

      const results = await uploadMultipleFiles(files);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('File Validation', () => {
    it('should validate file size', () => {
      const { validateFile } = require('@/shared/api/fileUploadService');
      
      const smallFile = createMockFile('small.pdf', 1024); // 1KB
      const largeFile = createMockFile('large.pdf', 15 * 1024 * 1024); // 15MB

      expect(validateFile(smallFile, { maxSize: 10 }).valid).toBe(true);
      expect(validateFile(largeFile, { maxSize: 10 }).valid).toBe(false);
    });

    it('should validate file type', () => {
      const { validateFile } = require('@/shared/api/fileUploadService');
      
      const pdfFile = createMockFile('doc.pdf', 1024, 'application/pdf');
      const exeFile = createMockFile('virus.exe', 1024, 'application/exe');

      expect(validateFile(pdfFile, { allowedTypes: ['pdf', 'jpg', 'png'] }).valid).toBe(true);
      expect(validateFile(exeFile, { allowedTypes: ['pdf', 'jpg', 'png'] }).valid).toBe(false);
    });

    it('should use default validation rules', () => {
      const { validateFile } = require('@/shared/api/fileUploadService');
      
      const validFile = createMockFile('doc.pdf', 5 * 1024 * 1024); // 5MB PDF
      const result = validateFile(validFile);

      expect(result.valid).toBe(true);
    });
  });

  describe('File Deletion', () => {
    it('should successfully delete a file', async () => {
      const { deleteFile } = await import('@/shared/api/fileUploadService');
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockAuthSession },
        error: null
      } as any);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      const result = await deleteFile('https://storage.example.com/file.pdf');

      expect(result).toBe(true);
    });

    it('should fail deletion without authentication', async () => {
      const { deleteFile } = await import('@/shared/api/fileUploadService');
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null
      } as any);

      const result = await deleteFile('https://storage.example.com/file.pdf');

      expect(result).toBe(false);
    });

    it('should handle deletion errors', async () => {
      const { deleteFile } = await import('@/shared/api/fileUploadService');
      const { supabase } = await import('@/shared/api/supabaseClient');
      
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: mockAuthSession },
        error: null
      } as any);

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'File not found' })
      } as Response);

      const result = await deleteFile('https://storage.example.com/nonexistent.pdf');

      expect(result).toBe(false);
    });
  });

  describe('Document URL Generation', () => {
    it('should generate document access URL for inline viewing', () => {
      const { getDocumentUrl } = require('@/shared/api/fileUploadService');
      
      const url = getDocumentUrl('https://storage.example.com/file.pdf', 'inline');

      expect(url).toContain('/document-access');
      expect(url).toContain('mode=inline');
      expect(url).toContain(encodeURIComponent('https://storage.example.com/file.pdf'));
    });

    it('should generate document access URL for download', () => {
      const { getDocumentUrl } = require('@/shared/api/fileUploadService');
      
      const url = getDocumentUrl('https://storage.example.com/file.pdf', 'download');

      expect(url).toContain('/document-access');
      expect(url).toContain('mode=download');
    });

    it('should default to inline mode', () => {
      const { getDocumentUrl } = require('@/shared/api/fileUploadService');
      
      const url = getDocumentUrl('https://storage.example.com/file.pdf');

      expect(url).toContain('mode=inline');
    });
  });
});
