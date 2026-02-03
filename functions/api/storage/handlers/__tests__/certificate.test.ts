/**
 * Unit tests for course certificate handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCourseCertificate } from '../certificate';

// Mock R2Client
vi.mock('../../utils/r2-client', () => {
  const mockGetObject = vi.fn();
  const mockExtractKeyFromUrl = vi.fn();

  return {
    R2Client: class MockR2Client {
      static extractKeyFromUrl = mockExtractKeyFromUrl;
      getObject = mockGetObject;
    },
    mockGetObject,
    mockExtractKeyFromUrl,
  };
});

// Import mocks after vi.mock
const { mockGetObject, mockExtractKeyFromUrl } = (await import('../../utils/r2-client')) as any;

describe('Course Certificate Handler', () => {
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      CLOUDFLARE_ACCOUNT_ID: 'test-account',
      CLOUDFLARE_R2_ACCESS_KEY_ID: 'test-key',
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'test-secret',
      CLOUDFLARE_R2_BUCKET_NAME: 'test-bucket',
    };

    // Reset mocks
    vi.clearAllMocks();
    mockGetObject.mockResolvedValue(
      new Response(new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47]) as any]), {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      })
    );
    mockExtractKeyFromUrl.mockImplementation((url: string) => {
      if (url.includes('.r2.dev/')) {
        const parts = url.split('.r2.dev/');
        return parts[1] || null;
      }
      return null;
    });
  });

  describe('handleCourseCertificate', () => {
    it('should get certificate with key parameter in inline mode', async () => {
      const request = new Request(
        'http://localhost/course-certificate?key=certificates/user123/cert.png&mode=inline'
      );

      const response = await handleCourseCertificate({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');
      expect(response.headers.get('Content-Disposition')).toBe('inline; filename="cert.png"');
    });

    it('should get certificate with key parameter in download mode', async () => {
      const request = new Request(
        'http://localhost/course-certificate?key=certificates/user123/cert.png&mode=download'
      );

      const response = await handleCourseCertificate({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toBe(
        'attachment; filename="cert.png"'
      );
    });

    it('should default to inline mode when mode not specified', async () => {
      const request = new Request(
        'http://localhost/course-certificate?key=certificates/user123/cert.png'
      );

      const response = await handleCourseCertificate({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Disposition')).toBe('inline; filename="cert.png"');
    });

    it('should extract key from URL parameter', async () => {
      mockExtractKeyFromUrl.mockReturnValueOnce('certificates/user123/cert.png');

      const request = new Request(
        'http://localhost/course-certificate?url=https://pub-123.r2.dev/certificates/user123/cert.png'
      );

      const response = await handleCourseCertificate({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(mockExtractKeyFromUrl).toHaveBeenCalled();
    });

    it('should extract key from custom domain URL with certificates pattern', async () => {
      mockExtractKeyFromUrl.mockReturnValueOnce(null);

      const request = new Request(
        'http://localhost/course-certificate?url=https://custom.domain.com/certificates/user123/cert.png'
      );

      const response = await handleCourseCertificate({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(mockGetObject).toHaveBeenCalledWith('certificates/user123/cert.png');
    });

    it('should handle different content types', async () => {
      mockGetObject.mockResolvedValueOnce(
        new Response(new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0]) as any]), {
          status: 200,
          headers: { 'Content-Type': 'image/jpeg' },
        })
      );

      const request = new Request(
        'http://localhost/course-certificate?key=certificates/user123/cert.jpg'
      );

      const response = await handleCourseCertificate({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/jpeg');
      expect(response.headers.get('Content-Disposition')).toBe('inline; filename="cert.jpg"');
    });

    it('should default to image/png when content type not provided', async () => {
      // Create a response without Content-Type header
      const blob = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])]);
      const mockResponse = new Response(blob, { status: 200 });
      // Remove Content-Type header
      const headers = new Headers(mockResponse.headers);
      headers.delete('Content-Type');
      const responseWithoutContentType = new Response(mockResponse.body, {
        status: 200,
        headers,
      });

      mockGetObject.mockResolvedValueOnce(responseWithoutContentType);

      const request = new Request(
        'http://localhost/course-certificate?key=certificates/user123/cert.png'
      );

      const response = await handleCourseCertificate({ request, env: mockEnv } as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');
    });

    it('should reject request without key or url parameter', async () => {
      mockExtractKeyFromUrl.mockReturnValueOnce(null);

      const request = new Request('http://localhost/course-certificate');

      const response = await handleCourseCertificate({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File key or URL is required');
    });

    it('should reject non-GET requests', async () => {
      const request = new Request('http://localhost/course-certificate?key=test.png', {
        method: 'POST',
      });

      const response = await handleCourseCertificate({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 404 when certificate not found', async () => {
      mockGetObject.mockResolvedValueOnce(new Response(null, { status: 404 }));

      const request = new Request(
        'http://localhost/course-certificate?key=certificates/nonexistent.png'
      );

      const response = await handleCourseCertificate({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('File not found or access denied');
    });

    it('should include CORS headers in response', async () => {
      const request = new Request(
        'http://localhost/course-certificate?key=certificates/user123/cert.png'
      );

      const response = await handleCourseCertificate({ request, env: mockEnv } as any);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
    });

    it('should handle R2 client errors gracefully', async () => {
      mockGetObject.mockRejectedValueOnce(new Error('R2 connection failed'));

      const request = new Request(
        'http://localhost/course-certificate?key=certificates/user123/cert.png'
      );

      const response = await handleCourseCertificate({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get certificate');
      expect(data.details).toBe('R2 connection failed');
    });
  });
});
