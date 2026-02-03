/**
 * Unit tests for document access handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleDocumentAccess } from '../document-access';

// Mock R2Client
vi.mock('../../utils/r2-client', () => {
  const mockGetObject = vi.fn();
  const mockExtractKeyFromUrl = vi.fn();
  
  return {
    R2Client: class MockR2Client {
      static extractKeyFromUrl = mockExtractKeyFromUrl;
      getObject = mockGetObject;
      
      // Expose mocks for testing
      static __mockGetObject = mockGetObject;
      static __mockExtractKeyFromUrl = mockExtractKeyFromUrl;
    },
  };
});

// Import after mock
import { R2Client } from '../../utils/r2-client';
const mockGetObject = (R2Client as any).__mockGetObject;
const mockExtractKeyFromUrl = (R2Client as any).__mockExtractKeyFromUrl;

// Helper to create mock Response
function createMockResponse(body: Uint8Array, contentType: string = 'application/pdf', etag: string = '"abc123"') {
  return new Response(new Blob([body as any]), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'ETag': etag,
    },
  });
}

describe('Document Access Handler', () => {
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      CLOUDFLARE_ACCOUNT_ID: 'test-account',
      CLOUDFLARE_R2_ACCESS_KEY_ID: 'test-key',
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'test-secret',
      CLOUDFLARE_R2_BUCKET_NAME: 'test-bucket',
    };
    
    // Reset mocks and set default behavior
    vi.clearAllMocks();
    mockGetObject.mockResolvedValue(
      createMockResponse(new Uint8Array([0x25, 0x50, 0x44, 0x46])) // PDF header
    );
    mockExtractKeyFromUrl.mockImplementation((url: string) => {
      if (url.includes('.r2.dev/')) {
        const parts = url.split('.r2.dev/');
        return parts[1] || null;
      }
      if (url.includes('/teachers/') || url.includes('/students/')) {
        const match = url.match(/\/(teachers|students)\/(.+)$/);
        return match ? `${match[1]}/${match[2]}` : null;
      }
      return null;
    });
  });

  describe('handleDocumentAccess', () => {
    it('should proxy document with key parameter in inline mode', async () => {
      const request = new Request(
        'http://localhost/document-access?key=courses/course-123/test.pdf&mode=inline'
      );

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toBe('inline; filename="test.pdf"');
      // Blob wrapping adds some overhead, so we just check it's a reasonable size
      expect(parseInt(response.headers.get('Content-Length') || '0')).toBeGreaterThan(0);
      expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600');
      expect(response.headers.get('ETag')).toBe('"abc123"');
    });

    it('should proxy document with key parameter in download mode', async () => {
      const request = new Request(
        'http://localhost/document-access?key=courses/course-123/test.pdf&mode=download'
      );

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="test.pdf"');
    });

    it('should default to inline mode when mode not specified', async () => {
      const request = new Request(
        'http://localhost/document-access?key=courses/course-123/test.pdf'
      );

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toBe('inline; filename="test.pdf"');
    });

    it('should extract key from R2 URL parameter', async () => {
      mockExtractKeyFromUrl.mockReturnValueOnce('courses/course-123/test.pdf');

      const request = new Request(
        'http://localhost/document-access?url=https://pub-123.r2.dev/courses/course-123/test.pdf'
      );

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(mockExtractKeyFromUrl).toHaveBeenCalledWith(
        'https://pub-123.r2.dev/courses/course-123/test.pdf'
      );
    });

    it('should extract key from storage API URL', async () => {
      mockExtractKeyFromUrl.mockReturnValueOnce('teachers/document.pdf');

      const request = new Request(
        'http://localhost/document-access?url=https://example.com/teachers/document.pdf'
      );

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(mockExtractKeyFromUrl).toHaveBeenCalled();
    });

    it('should reject request without key or url parameter', async () => {
      mockExtractKeyFromUrl.mockReturnValueOnce(null);
      
      const request = new Request('http://localhost/document-access');

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File key or URL is required');
    });

    it('should reject non-GET requests', async () => {
      const request = new Request('http://localhost/document-access?key=test.pdf', {
        method: 'POST',
      });

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 404 when file not found', async () => {
      mockGetObject.mockResolvedValueOnce(new Response(null, { status: 404 }));

      const request = new Request(
        'http://localhost/document-access?key=nonexistent.pdf'
      );

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('File not found or access denied');
    });

    it('should handle files with special characters in filename', async () => {
      const request = new Request(
        'http://localhost/document-access?key=courses/course-123/my%20file%20(1).pdf'
      );

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      // URL decoding happens automatically, so the filename is decoded
      expect(response.headers.get('Content-Disposition')).toContain('my file (1).pdf');
    });

    it('should handle nested folder structures', async () => {
      const request = new Request(
        'http://localhost/document-access?key=courses/course-123/lessons/lesson-456/resources/test.pdf'
      );

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toBe('inline; filename="test.pdf"');
    });

    it('should handle files without extension', async () => {
      const request = new Request(
        'http://localhost/document-access?key=courses/course-123/document'
      );

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toBe('inline; filename="document"');
    });

    it('should include ETag header for caching', async () => {
      const request = new Request(
        'http://localhost/document-access?key=courses/course-123/test.pdf'
      );

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('ETag')).toBe('"abc123"');
    });

    it('should set cache control header', async () => {
      const request = new Request(
        'http://localhost/document-access?key=courses/course-123/test.pdf'
      );

      const response = await handleDocumentAccess({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600');
    });
  });
});
