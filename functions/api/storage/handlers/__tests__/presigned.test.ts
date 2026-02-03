/**
 * Unit tests for presigned URL handlers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handlePresigned, handleConfirm, handleGetUrl, handleGetFileUrl } from '../presigned';

// Mock R2Client
vi.mock('../../utils/r2-client', () => ({
  R2Client: vi.fn().mockImplementation(() => ({
    generatePresignedUrl: vi.fn().mockResolvedValue({
      url: 'https://example.r2.cloudflarestorage.com/bucket/test-key?signature=abc123',
      headers: {
        'Content-Type': 'application/pdf',
        'Authorization': 'AWS4-HMAC-SHA256 Credential=...',
        'x-amz-date': '20240101T000000Z',
      },
    }),
    getPublicUrl: vi.fn().mockReturnValue('https://pub-123.r2.dev/test-key'),
  })),
}));

describe('Presigned URL Handlers', () => {
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      CLOUDFLARE_ACCOUNT_ID: 'test-account',
      CLOUDFLARE_R2_ACCESS_KEY_ID: 'test-key',
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'test-secret',
      CLOUDFLARE_R2_BUCKET_NAME: 'test-bucket',
    };
    vi.clearAllMocks();
  });

  describe('handlePresigned', () => {
    it('should generate presigned URL with valid request', async () => {
      const request = new Request('http://localhost/presigned', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.pdf',
          contentType: 'application/pdf',
          courseId: 'course-123',
          lessonId: 'lesson-456',
        }),
      });

      const response = await handlePresigned({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('uploadUrl');
      expect(data.data).toHaveProperty('fileKey');
      expect(data.data).toHaveProperty('headers');
      expect(data.data.fileKey).toMatch(/^courses\/course-123\/lessons\/lesson-456\/\d+-[a-f0-9]+\.pdf$/);
      expect(data.data.headers['Content-Type']).toBe('application/pdf');
      expect(data.data.headers['Authorization']).toBeDefined();
      expect(data.data.headers['x-amz-date']).toBeDefined();
    });

    it('should reject non-POST requests', async () => {
      const request = new Request('http://localhost/presigned', {
        method: 'GET',
      });

      const response = await handlePresigned({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should reject request missing filename', async () => {
      const request = new Request('http://localhost/presigned', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'application/pdf',
          courseId: 'course-123',
          lessonId: 'lesson-456',
        }),
      });

      const response = await handlePresigned({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
      expect(data.required).toContain('filename');
    });

    it('should reject request missing contentType', async () => {
      const request = new Request('http://localhost/presigned', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.pdf',
          courseId: 'course-123',
          lessonId: 'lesson-456',
        }),
      });

      const response = await handlePresigned({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
      expect(data.required).toContain('contentType');
    });

    it('should reject request missing courseId', async () => {
      const request = new Request('http://localhost/presigned', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.pdf',
          contentType: 'application/pdf',
          lessonId: 'lesson-456',
        }),
      });

      const response = await handlePresigned({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
      expect(data.required).toContain('courseId');
    });

    it('should reject request missing lessonId', async () => {
      const request = new Request('http://localhost/presigned', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.pdf',
          contentType: 'application/pdf',
          courseId: 'course-123',
        }),
      });

      const response = await handlePresigned({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
      expect(data.required).toContain('lessonId');
    });

    it('should handle file with multiple dots in filename', async () => {
      const request = new Request('http://localhost/presigned', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'my.test.file.pdf',
          contentType: 'application/pdf',
          courseId: 'course-123',
          lessonId: 'lesson-456',
        }),
      });

      const response = await handlePresigned({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.fileKey).toMatch(/\.pdf$/);
    });

    it('should include optional fileSize in request', async () => {
      const request = new Request('http://localhost/presigned', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.pdf',
          contentType: 'application/pdf',
          courseId: 'course-123',
          lessonId: 'lesson-456',
          fileSize: 1024000,
        }),
      });

      const response = await handlePresigned({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('handleConfirm', () => {
    it('should confirm upload and return public URL', async () => {
      const request = new Request('http://localhost/confirm', {
        method: 'POST',
        body: JSON.stringify({
          fileKey: 'courses/course-123/lessons/lesson-456/test.pdf',
          fileName: 'test.pdf',
          fileSize: 1024000,
          fileType: 'application/pdf',
        }),
      });

      const response = await handleConfirm({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('key');
      expect(data.data).toHaveProperty('url');
      expect(data.data).toHaveProperty('name');
      expect(data.data).toHaveProperty('size');
      expect(data.data).toHaveProperty('type');
      expect(data.data.key).toBe('courses/course-123/lessons/lesson-456/test.pdf');
      expect(data.data.name).toBe('test.pdf');
      expect(data.data.size).toBe(1024000);
      expect(data.data.type).toBe('application/pdf');
    });

    it('should reject non-POST requests', async () => {
      const request = new Request('http://localhost/confirm', {
        method: 'GET',
      });

      const response = await handleConfirm({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should reject request missing fileKey', async () => {
      const request = new Request('http://localhost/confirm', {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'test.pdf',
        }),
      });

      const response = await handleConfirm({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing fileKey');
    });

    it('should work with minimal data (only fileKey)', async () => {
      const request = new Request('http://localhost/confirm', {
        method: 'POST',
        body: JSON.stringify({
          fileKey: 'courses/course-123/lessons/lesson-456/test.pdf',
        }),
      });

      const response = await handleConfirm({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.key).toBe('courses/course-123/lessons/lesson-456/test.pdf');
      expect(data.data.name).toBeUndefined();
      expect(data.data.size).toBeUndefined();
      expect(data.data.type).toBeUndefined();
    });
  });

  describe('handleGetUrl', () => {
    it('should return public URL for valid fileKey', async () => {
      const request = new Request('http://localhost/get-url', {
        method: 'POST',
        body: JSON.stringify({
          fileKey: 'courses/course-123/lessons/lesson-456/test.pdf',
        }),
      });

      const response = await handleGetUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.url).toBe('https://pub-123.r2.dev/test-key');
    });

    it('should reject non-POST requests', async () => {
      const request = new Request('http://localhost/get-url', {
        method: 'GET',
      });

      const response = await handleGetUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toBe('Method not allowed');
    });

    it('should reject request missing fileKey', async () => {
      const request = new Request('http://localhost/get-url', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await handleGetUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('fileKey is required');
    });

    it('should handle fileKey with special characters', async () => {
      const request = new Request('http://localhost/get-url', {
        method: 'POST',
        body: JSON.stringify({
          fileKey: 'courses/course-123/lessons/lesson-456/test file (1).pdf',
        }),
      });

      const response = await handleGetUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('handleGetFileUrl', () => {
    it('should be an alias for handleGetUrl', () => {
      expect(handleGetFileUrl).toBe(handleGetUrl);
    });

    it('should work identically to handleGetUrl', async () => {
      const request = new Request('http://localhost/get-file-url', {
        method: 'POST',
        body: JSON.stringify({
          fileKey: 'courses/course-123/lessons/lesson-456/test.pdf',
        }),
      });

      const response = await handleGetFileUrl({ request, env: mockEnv } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.url).toBe('https://pub-123.r2.dev/test-key');
    });
  });
});
