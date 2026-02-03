/**
 * Unit tests for PDF content extraction handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleExtractContent } from '../extract-content';

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();

vi.mock('../../../../../src/functions-lib/supabase', () => ({
  createSupabaseClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock fetch for PDF downloads
global.fetch = vi.fn();

describe('Extract Content Handler', () => {
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
    };

    // Reset mocks
    vi.clearAllMocks();

    // Setup default mock chain for SELECT queries
    const selectChain = {
      eq: mockEq,
      in: mockIn,
    };
    mockSelect.mockReturnValue(selectChain);
    mockEq.mockReturnValue({ data: [], error: null });
    mockIn.mockReturnValue({ data: [], error: null });

    // Setup default mock chain for UPDATE queries
    const updateChain = {
      eq: mockEq,
    };
    mockUpdate.mockReturnValue(updateChain);

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });

    // Mock fetch for PDF downloads
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  describe('handleExtractContent', () => {
    it('should extract content from single resource by resourceId', async () => {
      const mockResource = {
        resource_id: 'res-123',
        name: 'test.pdf',
        type: 'pdf',
        url: 'https://example.com/test.pdf',
        lesson_id: 'lesson-1',
      };

      // Mock SELECT query
      mockEq.mockReturnValueOnce({ data: [mockResource], error: null });
      // Mock UPDATE query
      mockEq.mockReturnValueOnce({ data: null, error: null });

      const request = new Request('http://localhost/extract-content', {
        method: 'POST',
        body: JSON.stringify({ resourceId: 'res-123' }),
      });

      const response = await handleExtractContent({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(1);
      expect(data.results).toHaveLength(1);
      expect(data.results[0].status).toBe('success');
      expect(data.results[0].resourceId).toBe('res-123');
      expect(mockFrom).toHaveBeenCalledWith('lesson_resources');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should extract content from multiple resources by resourceIds', async () => {
      const mockResources = [
        {
          resource_id: 'res-1',
          name: 'doc1.pdf',
          type: 'pdf',
          url: 'https://example.com/doc1.pdf',
        },
        {
          resource_id: 'res-2',
          name: 'doc2.pdf',
          type: 'pdf',
          url: 'https://example.com/doc2.pdf',
        },
      ];

      // Mock SELECT query
      mockIn.mockReturnValueOnce({ data: mockResources, error: null });
      // Mock UPDATE queries (2 resources)
      mockEq.mockReturnValue({ data: null, error: null });

      const request = new Request('http://localhost/extract-content', {
        method: 'POST',
        body: JSON.stringify({ resourceIds: ['res-1', 'res-2'] }),
      });

      const response = await handleExtractContent({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(2);
      expect(data.results).toHaveLength(2);
      expect(data.results[0].status).toBe('success');
      expect(data.results[1].status).toBe('success');
      expect(mockIn).toHaveBeenCalledWith('resource_id', ['res-1', 'res-2']);
    });

    it('should extract content from all resources in a lesson', async () => {
      const mockResources = [
        {
          resource_id: 'res-1',
          name: 'lesson-doc.pdf',
          type: 'pdf',
          url: 'https://example.com/lesson-doc.pdf',
          lesson_id: 'lesson-123',
        },
      ];

      // Mock SELECT query
      mockEq.mockReturnValueOnce({ data: mockResources, error: null });
      // Mock UPDATE query
      mockEq.mockReturnValueOnce({ data: null, error: null });

      const request = new Request('http://localhost/extract-content', {
        method: 'POST',
        body: JSON.stringify({ lessonId: 'lesson-123' }),
      });

      const response = await handleExtractContent({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(1);
    });

    it('should skip non-PDF/document resources', async () => {
      const mockResources = [
        {
          resource_id: 'res-1',
          name: 'video.mp4',
          type: 'video',
          url: 'https://example.com/video.mp4',
        },
        {
          resource_id: 'res-2',
          name: 'doc.pdf',
          type: 'pdf',
          url: 'https://example.com/doc.pdf',
        },
      ];

      // Mock SELECT query
      mockIn.mockReturnValueOnce({ data: mockResources, error: null });
      // Mock UPDATE query (only for PDF)
      mockEq.mockReturnValue({ data: null, error: null });

      const request = new Request('http://localhost/extract-content', {
        method: 'POST',
        body: JSON.stringify({ resourceIds: ['res-1', 'res-2'] }),
      });

      const response = await handleExtractContent({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.processed).toBe(2);
      expect(data.results[0].status).toBe('skipped');
      expect(data.results[0].reason).toContain('video');
      expect(data.results[1].status).toBe('success');
    });

    it('should handle PDF download failures', async () => {
      const mockResource = {
        resource_id: 'res-123',
        name: 'test.pdf',
        type: 'pdf',
        url: 'https://example.com/test.pdf',
      };

      // Mock SELECT query
      mockEq.mockReturnValueOnce({ data: [mockResource], error: null });

      // Mock failed PDF download
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const request = new Request('http://localhost/extract-content', {
        method: 'POST',
        body: JSON.stringify({ resourceId: 'res-123' }),
      });

      const response = await handleExtractContent({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].status).toBe('error');
      expect(data.results[0].error).toContain('Failed to download');
    });

    it('should handle database update failures', async () => {
      const mockResource = {
        resource_id: 'res-123',
        name: 'test.pdf',
        type: 'pdf',
        url: 'https://example.com/test.pdf',
      };

      // Mock SELECT query
      mockEq.mockReturnValueOnce({ data: [mockResource], error: null });
      // Mock failed UPDATE query
      mockEq.mockReturnValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const request = new Request('http://localhost/extract-content', {
        method: 'POST',
        body: JSON.stringify({ resourceId: 'res-123' }),
      });

      const response = await handleExtractContent({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].status).toBe('error');
      expect(data.results[0].error).toContain('Failed to update');
    });

    it('should reject request without required parameters', async () => {
      const request = new Request('http://localhost/extract-content', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await handleExtractContent({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Provide resourceId, resourceIds, or lessonId');
    });

    it('should reject request with empty resourceIds array', async () => {
      const request = new Request('http://localhost/extract-content', {
        method: 'POST',
        body: JSON.stringify({ resourceIds: [] }),
      });

      const response = await handleExtractContent({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Provide resourceId, resourceIds, or lessonId');
    });

    it('should reject invalid JSON body', async () => {
      const request = new Request('http://localhost/extract-content', {
        method: 'POST',
        body: 'invalid json{{{',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await handleExtractContent({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON body');
    });

    it('should reject non-POST requests', async () => {
      const request = new Request('http://localhost/extract-content', {
        method: 'GET',
      });

      const response = await handleExtractContent({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 404 when resources not found', async () => {
      // Mock SELECT query with error
      mockEq.mockReturnValueOnce({ data: null, error: { message: 'Not found' } });

      const request = new Request('http://localhost/extract-content', {
        method: 'POST',
        body: JSON.stringify({ resourceId: 'nonexistent' }),
      });

      const response = await handleExtractContent({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Resources not found');
    });

    it('should handle Supabase client creation errors', async () => {
      const request = new Request('http://localhost/extract-content', {
        method: 'POST',
        body: JSON.stringify({ resourceId: 'res-123' }),
      });

      mockFrom.mockImplementationOnce(() => {
        throw new Error('Supabase connection failed');
      });

      const response = await handleExtractContent({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to extract content');
      expect(data.details).toBe('Supabase connection failed');
    });
  });
});
