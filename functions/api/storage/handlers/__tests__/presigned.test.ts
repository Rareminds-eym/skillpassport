/**
 * Unit tests for legacy URL handlers after binding-only R2 migration.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleConfirm, handleGetFileUrl, handleGetUrl, handlePresigned } from '../presigned';

const mockGetPublicUrl = vi.fn();

vi.mock('../../utils/r2-client', () => ({
  R2Client: vi.fn().mockImplementation(() => ({
    getPublicUrl: mockGetPublicUrl,
  })),
}));

describe('Legacy URL Handlers', () => {
  let mockEnv: any;
  const user = { id: 'user-123' };

  beforeEach(() => {
    mockEnv = { R2_BUCKET: {} };
    mockGetPublicUrl.mockReturnValue('https://storage.example.com/uploads/user-123/file.pdf');
    vi.clearAllMocks();
  });

  describe('handlePresigned', () => {
    it('returns gone because direct R2 presigned uploads are disabled', async () => {
      const request = new Request('http://localhost/api/storage/presigned', {
        method: 'POST',
        body: JSON.stringify({
          filename: 'test.pdf',
          contentType: 'application/pdf',
          courseId: 'course-123',
          lessonId: 'lesson-456',
        }),
      });

      const response = await handlePresigned({ request, env: mockEnv, user } as any);
      const data = await response.json() as any;

      expect(response.status).toBe(410);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PRESIGNED_UPLOAD_DISABLED');
    });

    it('rejects non-POST requests', async () => {
      const request = new Request('http://localhost/api/storage/presigned');

      const response = await handlePresigned({ request, env: mockEnv, user } as any);

      expect(response.status).toBe(405);
    });
  });

  describe('handleConfirm', () => {
    it('confirms upload and returns the configured public URL', async () => {
      const request = new Request('http://localhost/api/storage/confirm', {
        method: 'POST',
        body: JSON.stringify({
          fileKey: 'uploads/user-123/file.pdf',
          fileName: 'file.pdf',
          fileSize: 1024,
          fileType: 'application/pdf',
        }),
      });

      const response = await handleConfirm({ request, env: mockEnv, user } as any);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        key: 'uploads/user-123/file.pdf',
        url: 'https://storage.example.com/uploads/user-123/file.pdf',
        name: 'file.pdf',
        size: 1024,
        type: 'application/pdf',
      });
    });
  });

  describe('handleGetUrl', () => {
    it('returns an app proxy URL for a file key', async () => {
      const request = new Request('http://localhost/api/storage/get-url', {
        method: 'POST',
        body: JSON.stringify({
          fileKey: 'uploads/user-123/file.pdf',
        }),
      });

      const response = await handleGetUrl({ request, env: mockEnv, user } as any);
      const data = await response.json() as any;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.url).toBe(
        'http://localhost/api/storage/document-access?key=uploads%2Fuser-123%2Ffile.pdf&mode=inline'
      );
      expect(data.data.expiresAt).toBeNull();
    });

    it('rejects requests missing fileKey', async () => {
      const request = new Request('http://localhost/api/storage/get-url', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await handleGetUrl({ request, env: mockEnv, user } as any);

      expect(response.status).toBe(400);
    });
  });

  describe('handleGetFileUrl', () => {
    it('is an alias for handleGetUrl', () => {
      expect(handleGetFileUrl).toBe(handleGetUrl);
    });
  });
});
