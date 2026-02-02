/**
 * Unit tests for signed URL handlers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSignedUrl, handleSignedUrls } from '../signed-url';

// Mock R2Client
vi.mock('../../utils/r2-client', () => {
  const mockExtractKeyFromUrl = vi.fn();

  return {
    R2Client: class MockR2Client {
      static extractKeyFromUrl = mockExtractKeyFromUrl;

      // Expose mock for testing
      static __mockExtractKeyFromUrl = mockExtractKeyFromUrl;
    },
  };
});

// Import after mock
import { R2Client } from '../../utils/r2-client';
const mockExtractKeyFromUrl = (R2Client as any).__mockExtractKeyFromUrl;

describe('Signed URL Handlers', () => {
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

  describe('handleSignedUrl', () => {
    it('should generate signed URL with fileKey parameter', async () => {
      const request = new Request('http://localhost/signed-url', {
        method: 'POST',
        body: JSON.stringify({
          fileKey: 'courses/course-123/test.pdf',
        }),
      });

      const response = await handleSignedUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.signedUrl).toBe(
        'http://localhost/api/storage/document-access?key=courses%2Fcourse-123%2Ftest.pdf&mode=inline'
      );
      expect(data.expiresAt).toBeDefined();
      expect(new Date(data.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('should generate signed URL with url parameter', async () => {
      mockExtractKeyFromUrl.mockReturnValueOnce('courses/course-123/test.pdf');

      const request = new Request('http://localhost/signed-url', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://pub-123.r2.dev/courses/course-123/test.pdf',
        }),
      });

      const response = await handleSignedUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.signedUrl).toContain('/api/storage/document-access?key=');
      expect(mockExtractKeyFromUrl).toHaveBeenCalledWith(
        'https://pub-123.r2.dev/courses/course-123/test.pdf'
      );
    });

    it('should use custom expiresIn parameter', async () => {
      const request = new Request('http://localhost/signed-url', {
        method: 'POST',
        body: JSON.stringify({
          fileKey: 'courses/course-123/test.pdf',
          expiresIn: 7200, // 2 hours
        }),
      });

      const response = await handleSignedUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      const expiresAt = new Date(data.expiresAt).getTime();
      const expectedExpiry = Date.now() + 7200 * 1000;
      // Allow 1 second tolerance
      expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(1000);
    });

    it('should default to 1 hour expiration', async () => {
      const request = new Request('http://localhost/signed-url', {
        method: 'POST',
        body: JSON.stringify({
          fileKey: 'courses/course-123/test.pdf',
        }),
      });

      const response = await handleSignedUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      const expiresAt = new Date(data.expiresAt).getTime();
      const expectedExpiry = Date.now() + 3600 * 1000;
      // Allow 1 second tolerance
      expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(1000);
    });

    it('should reject request without fileKey or url', async () => {
      mockExtractKeyFromUrl.mockReturnValueOnce(null);

      const request = new Request('http://localhost/signed-url', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await handleSignedUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File key or URL is required');
    });

    it('should reject non-POST requests', async () => {
      const request = new Request('http://localhost/signed-url', {
        method: 'GET',
      });

      const response = await handleSignedUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should prefer fileKey over url parameter', async () => {
      const request = new Request('http://localhost/signed-url', {
        method: 'POST',
        body: JSON.stringify({
          fileKey: 'courses/course-123/test.pdf',
          url: 'https://pub-123.r2.dev/courses/course-456/other.pdf',
        }),
      });

      const response = await handleSignedUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signedUrl).toContain('courses%2Fcourse-123%2Ftest.pdf');
      expect(mockExtractKeyFromUrl).not.toHaveBeenCalled();
    });

    it('should URL encode file keys with special characters', async () => {
      const request = new Request('http://localhost/signed-url', {
        method: 'POST',
        body: JSON.stringify({
          fileKey: 'courses/course-123/my file (1).pdf',
        }),
      });

      const response = await handleSignedUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signedUrl).toContain('my%20file%20(1).pdf');
    });
  });

  describe('handleSignedUrls', () => {
    it('should generate signed URLs for multiple files', async () => {
      // Override the default mock for this test
      mockExtractKeyFromUrl.mockReset();
      mockExtractKeyFromUrl.mockImplementation((url: string) => {
        if (url.includes('test1.pdf')) return 'courses/course-123/test1.pdf';
        if (url.includes('test2.pdf')) return 'courses/course-123/test2.pdf';
        if (url.includes('test3.pdf')) return 'courses/course-123/test3.pdf';
        return null;
      });

      const request = new Request('http://localhost/signed-urls', {
        method: 'POST',
        body: JSON.stringify({
          urls: [
            'https://pub-123.r2.dev/courses/course-123/test1.pdf',
            'https://pub-123.r2.dev/courses/course-123/test2.pdf',
            'https://pub-123.r2.dev/courses/course-123/test3.pdf',
          ],
        }),
      });

      const response = await handleSignedUrls({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.signedUrls).toBeDefined();
      expect(Object.keys(data.signedUrls)).toHaveLength(3);
      expect(data.signedUrls['https://pub-123.r2.dev/courses/course-123/test1.pdf']).toContain(
        '/api/storage/document-access?key='
      );
      expect(data.expiresAt).toBeDefined();
    });

    it('should use custom expiresIn parameter', async () => {
      mockExtractKeyFromUrl.mockReturnValueOnce('courses/course-123/test.pdf');

      const request = new Request('http://localhost/signed-urls', {
        method: 'POST',
        body: JSON.stringify({
          urls: ['https://pub-123.r2.dev/courses/course-123/test.pdf'],
          expiresIn: 7200, // 2 hours
        }),
      });

      const response = await handleSignedUrls({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      const expiresAt = new Date(data.expiresAt).getTime();
      const expectedExpiry = Date.now() + 7200 * 1000;
      expect(Math.abs(expiresAt - expectedExpiry)).toBeLessThan(1000);
    });

    it('should fallback to original URL if key extraction fails', async () => {
      mockExtractKeyFromUrl.mockReset();
      mockExtractKeyFromUrl.mockImplementation((url: string) => {
        // Return null for this specific URL to test fallback
        if (url.includes('unknown')) return null;
        return 'courses/course-123/test.pdf';
      });

      const request = new Request('http://localhost/signed-urls', {
        method: 'POST',
        body: JSON.stringify({
          urls: ['https://example.com/unknown/path/file.pdf'],
        }),
      });

      const response = await handleSignedUrls({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signedUrls['https://example.com/unknown/path/file.pdf']).toBe(
        'https://example.com/unknown/path/file.pdf'
      );
    });

    it('should reject request without urls array', async () => {
      const request = new Request('http://localhost/signed-urls', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await handleSignedUrls({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URLs array is required');
    });

    it('should reject request with non-array urls', async () => {
      const request = new Request('http://localhost/signed-urls', {
        method: 'POST',
        body: JSON.stringify({
          urls: 'not-an-array',
        }),
      });

      const response = await handleSignedUrls({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URLs array is required');
    });

    it('should reject request with empty urls array', async () => {
      const request = new Request('http://localhost/signed-urls', {
        method: 'POST',
        body: JSON.stringify({
          urls: [],
        }),
      });

      const response = await handleSignedUrls({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URLs array cannot be empty');
    });

    it('should reject non-POST requests', async () => {
      const request = new Request('http://localhost/signed-urls', {
        method: 'GET',
      });

      const response = await handleSignedUrls({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should handle mixed success and fallback URLs', async () => {
      mockExtractKeyFromUrl.mockReset();
      mockExtractKeyFromUrl.mockImplementation((url: string) => {
        if (url.includes('test1.pdf')) return 'courses/course-123/test1.pdf';
        if (url.includes('unknown')) return null;
        if (url.includes('test3.pdf')) return 'courses/course-123/test3.pdf';
        return null;
      });

      const request = new Request('http://localhost/signed-urls', {
        method: 'POST',
        body: JSON.stringify({
          urls: [
            'https://pub-123.r2.dev/courses/course-123/test1.pdf',
            'https://example.com/unknown/file.pdf',
            'https://pub-123.r2.dev/courses/course-123/test3.pdf',
          ],
        }),
      });

      const response = await handleSignedUrls({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.signedUrls['https://pub-123.r2.dev/courses/course-123/test1.pdf']).toContain(
        '/api/storage/document-access'
      );
      expect(data.signedUrls['https://example.com/unknown/file.pdf']).toBe(
        'https://example.com/unknown/file.pdf'
      );
      expect(data.signedUrls['https://pub-123.r2.dev/courses/course-123/test3.pdf']).toContain(
        '/api/storage/document-access'
      );
    });
  });
});
