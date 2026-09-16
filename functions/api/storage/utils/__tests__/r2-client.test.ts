/**
 * Unit tests for the binding-only R2Client.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { R2Client } from '../r2-client';
import type { PagesEnv } from '../../../../lib/types';

describe('R2Client', () => {
  const createBodyStream = (content: string) => {
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(content));
        controller.close();
      },
    });
  };

  let mockBucket: {
    put: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
  };
  let mockEnv: PagesEnv;

  beforeEach(() => {
    mockBucket = {
      put: vi.fn().mockResolvedValue({}),
      get: vi.fn().mockResolvedValue({
        body: createBodyStream('file content'),
        httpMetadata: { contentType: 'text/plain' },
        size: 12,
        httpEtag: '"etag-1"',
      }),
      delete: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue({
        objects: [
          {
            key: 'test/file1.txt',
            size: 100,
            uploaded: new Date('2024-01-01T00:00:00.000Z'),
            etag: 'abc123',
          },
          {
            key: 'test/file2.txt',
            size: 200,
            uploaded: new Date('2024-01-02T00:00:00.000Z'),
            etag: 'def456',
          },
        ],
      }),
    };

    mockEnv = {
      R2_BUCKET: mockBucket as any,
      CLOUDFLARE_R2_PUBLIC_URL: 'https://test.r2.dev/',
    };
  });

  describe('constructor', () => {
    it('creates R2Client with an R2_BUCKET binding', () => {
      const client = new R2Client(mockEnv);
      expect(client).toBeInstanceOf(R2Client);
    });

    it('throws when R2_BUCKET binding is missing', () => {
      expect(() => new R2Client({} as PagesEnv)).toThrow('R2_BUCKET binding is not configured');
    });
  });

  describe('upload', () => {
    it('uploads through the R2 binding', async () => {
      const client = new R2Client(mockEnv);
      const fileContent = new ArrayBuffer(100);

      await client.upload('test/file.txt', fileContent, 'text/plain');

      expect(mockBucket.put).toHaveBeenCalledWith('test/file.txt', fileContent, {
        httpMetadata: {
          contentType: 'text/plain',
          contentDisposition: undefined,
        },
      });
    });

    it('passes content disposition metadata when provided', async () => {
      const client = new R2Client(mockEnv);
      const fileContent = new ArrayBuffer(100);

      await client.upload('test/file.txt', fileContent, 'text/plain', {
        'Content-Disposition': 'attachment; filename="test.txt"',
      });

      expect(mockBucket.put).toHaveBeenCalledWith('test/file.txt', fileContent, {
        httpMetadata: {
          contentType: 'text/plain',
          contentDisposition: 'attachment; filename="test.txt"',
        },
      });
    });

    it('propagates binding upload failures', async () => {
      mockBucket.put.mockRejectedValueOnce(new Error('R2 upload failed'));
      const client = new R2Client(mockEnv);

      await expect(client.upload('test/file.txt', new ArrayBuffer(100), 'text/plain')).rejects.toThrow(
        'R2 upload failed'
      );
    });
  });

  describe('delete', () => {
    it('deletes through the R2 binding', async () => {
      const client = new R2Client(mockEnv);

      await client.delete('test/file.txt');

      expect(mockBucket.delete).toHaveBeenCalledWith('test/file.txt');
    });
  });

  describe('list', () => {
    it('lists files with prefix through the R2 binding', async () => {
      const client = new R2Client(mockEnv);

      const result = await client.list('test/');

      expect(mockBucket.list).toHaveBeenCalledWith({ prefix: 'test/', limit: 1000 });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        key: 'test/file1.txt',
        size: 100,
        lastModified: new Date('2024-01-01T00:00:00.000Z'),
        etag: 'abc123',
      });
    });

    it('passes a custom max key limit', async () => {
      const client = new R2Client(mockEnv);

      await client.list('test/', 25);

      expect(mockBucket.list).toHaveBeenCalledWith({ prefix: 'test/', limit: 25 });
    });
  });

  describe('getObject', () => {
    it('gets an object through the R2 binding', async () => {
      const client = new R2Client(mockEnv);

      const result = await client.getObject('test/file.txt');

      expect(mockBucket.get).toHaveBeenCalledWith('test/file.txt', undefined);
      expect(result.status).toBe(200);
      expect(result.headers.get('Content-Type')).toBe('text/plain');
      expect(await result.text()).toBe('file content');
    });

    it('gets a byte range through the R2 binding', async () => {
      const client = new R2Client(mockEnv);

      const result = await client.getObject('test/file.txt', 'bytes=0-3');

      expect(mockBucket.get).toHaveBeenCalledWith('test/file.txt', {
        range: { offset: 0, length: 4 },
      });
      expect(result.status).toBe(206);
      expect(result.headers.get('Content-Range')).toBe('bytes 0-3/12');
    });

    it('throws when object is missing', async () => {
      mockBucket.get.mockResolvedValueOnce(null);
      const client = new R2Client(mockEnv);

      await expect(client.getObject('test/missing.txt')).rejects.toThrow(
        'R2 get object failed: 404 - Not Found'
      );
    });

    it('rejects invalid range headers', async () => {
      const client = new R2Client(mockEnv);

      await expect(client.getObject('test/file.txt', 'bytes=10-1')).rejects.toThrow(
        'Invalid range'
      );
    });
  });

  describe('getPublicUrl', () => {
    it('returns custom public URL when configured', () => {
      const client = new R2Client(mockEnv);

      expect(client.getPublicUrl('test/file.txt')).toBe('https://test.r2.dev/test/file.txt');
    });

    it('throws when no public URL is configured', () => {
      const client = new R2Client({ R2_BUCKET: mockBucket as any });

      expect(() => client.getPublicUrl('test/file.txt')).toThrow('Public URL not configured for R2 bucket');
    });

    it('reports whether a public URL is configured', () => {
      expect(new R2Client(mockEnv).hasPublicUrl()).toBe(true);
      expect(new R2Client({ R2_BUCKET: mockBucket as any }).hasPublicUrl()).toBe(false);
    });
  });

  describe('extractKeyFromUrl', () => {
    it('extracts key from direct R2 URL', () => {
      expect(R2Client.extractKeyFromUrl('https://pub-xxx.r2.dev/test/file.txt')).toBe(
        'test/file.txt'
      );
    });

    it('extracts key from proxy URL with key parameter', () => {
      expect(R2Client.extractKeyFromUrl('https://example.com/document-access?key=test%2Ffile.txt')).toBe(
        'test/file.txt'
      );
    });

    it('extracts key from proxy URL with url parameter', () => {
      expect(
        R2Client.extractKeyFromUrl(
          'https://example.com/document-access?url=https%3A%2F%2Fpub-xxx.r2.dev%2Ftest%2Ffile.txt'
        )
      ).toBe('test/file.txt');
    });

    it('extracts key from custom domain URL', () => {
      expect(R2Client.extractKeyFromUrl('https://custom.domain.com/test/file.txt')).toBe(
        'test/file.txt'
      );
    });

    it('accepts a raw object key', () => {
      expect(R2Client.extractKeyFromUrl('test/file.txt')).toBe('test/file.txt');
    });

    it('returns null for empty input', () => {
      expect(R2Client.extractKeyFromUrl('   ')).toBeNull();
    });
  });
});
