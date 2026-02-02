/**
 * Unit tests for R2Client
 * Tests the R2 client wrapper functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { R2Client } from '../r2-client';
import type { PagesEnv } from '../../../../../src/functions-lib/types';

// Mock aws4fetch
vi.mock('aws4fetch', () => ({
  AwsClient: vi.fn().mockImplementation(() => ({
    sign: vi.fn().mockImplementation(async (request: Request) => {
      // Return a signed request with mock headers
      // Don't copy body to avoid duplex issues in tests
      const signedRequest = new Request(request.url, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          'Authorization': 'AWS4-HMAC-SHA256 Credential=mock/20240101/auto/s3/aws4_request',
          'x-amz-date': '20240101T000000Z',
        },
      });
      return signedRequest;
    }),
  })),
}));

describe('R2Client', () => {
  let mockEnv: PagesEnv;

  beforeEach(() => {
    mockEnv = {
      CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
      CLOUDFLARE_R2_ACCESS_KEY_ID: 'test-access-key',
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'test-secret-key',
      CLOUDFLARE_R2_BUCKET_NAME: 'test-bucket',
      CLOUDFLARE_R2_PUBLIC_URL: 'https://test.r2.dev',
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    };

    // Reset fetch mock
    global.fetch = vi.fn();
  });

  describe('constructor', () => {
    it('should create R2Client with valid credentials', () => {
      const client = new R2Client(mockEnv);
      expect(client).toBeInstanceOf(R2Client);
    });

    it('should throw error when CLOUDFLARE_ACCOUNT_ID is missing', () => {
      const invalidEnv = { ...mockEnv, CLOUDFLARE_ACCOUNT_ID: undefined };
      expect(() => new R2Client(invalidEnv)).toThrow('R2 credentials not configured');
    });

    it('should throw error when CLOUDFLARE_R2_ACCESS_KEY_ID is missing', () => {
      const invalidEnv = { ...mockEnv, CLOUDFLARE_R2_ACCESS_KEY_ID: undefined };
      expect(() => new R2Client(invalidEnv)).toThrow('R2 credentials not configured');
    });

    it('should throw error when CLOUDFLARE_R2_SECRET_ACCESS_KEY is missing', () => {
      const invalidEnv = { ...mockEnv, CLOUDFLARE_R2_SECRET_ACCESS_KEY: undefined };
      expect(() => new R2Client(invalidEnv)).toThrow('R2 credentials not configured');
    });

    it('should use default bucket name when not provided', () => {
      const envWithoutBucket = { ...mockEnv, CLOUDFLARE_R2_BUCKET_NAME: undefined };
      const client = new R2Client(envWithoutBucket);
      expect(client).toBeInstanceOf(R2Client);
    });
  });

  describe('upload', () => {
    it('should upload file successfully', async () => {
      const client = new R2Client(mockEnv);
      const mockResponse = new Response(null, { status: 200 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const fileContent = new ArrayBuffer(100);
      const result = await client.upload('test/file.txt', fileContent, 'text/plain');

      expect(result).toBe('https://test.r2.dev/test/file.txt');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when upload fails', async () => {
      const client = new R2Client(mockEnv);
      const mockResponse = new Response('Upload failed', { status: 500 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const fileContent = new ArrayBuffer(100);
      await expect(client.upload('test/file.txt', fileContent, 'text/plain'))
        .rejects.toThrow('R2 upload failed');
    });

    it('should include additional headers when provided', async () => {
      const client = new R2Client(mockEnv);
      const mockResponse = new Response(null, { status: 200 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const fileContent = new ArrayBuffer(100);
      await client.upload('test/file.txt', fileContent, 'text/plain', {
        'Content-Disposition': 'attachment; filename="test.txt"',
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('should delete file successfully', async () => {
      const client = new R2Client(mockEnv);
      const mockResponse = new Response(null, { status: 204 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await client.delete('test/file.txt');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle 200 response as success', async () => {
      const client = new R2Client(mockEnv);
      const mockResponse = new Response(null, { status: 200 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await client.delete('test/file.txt');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when delete fails', async () => {
      const client = new R2Client(mockEnv);
      const mockResponse = new Response('Delete failed', { status: 500 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(client.delete('test/file.txt'))
        .rejects.toThrow('R2 delete failed');
    });
  });

  describe('list', () => {
    it('should list files with prefix', async () => {
      const client = new R2Client(mockEnv);
      const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult>
  <Contents>
    <Key>test/file1.txt</Key>
    <Size>100</Size>
    <LastModified>2024-01-01T00:00:00.000Z</LastModified>
    <ETag>"abc123"</ETag>
  </Contents>
  <Contents>
    <Key>test/file2.txt</Key>
    <Size>200</Size>
    <LastModified>2024-01-02T00:00:00.000Z</LastModified>
    <ETag>"def456"</ETag>
  </Contents>
</ListBucketResult>`;
      const mockResponse = new Response(xmlResponse, { status: 200 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await client.list('test/');

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('test/file1.txt');
      expect(result[0].size).toBe(100);
      expect(result[1].key).toBe('test/file2.txt');
      expect(result[1].size).toBe(200);
    });

    it('should return empty array when no files match prefix', async () => {
      const client = new R2Client(mockEnv);
      const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult>
</ListBucketResult>`;
      const mockResponse = new Response(xmlResponse, { status: 200 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await client.list('nonexistent/');

      expect(result).toHaveLength(0);
    });

    it('should throw error when list fails', async () => {
      const client = new R2Client(mockEnv);
      const mockResponse = new Response('List failed', { status: 500 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(client.list('test/'))
        .rejects.toThrow('R2 list failed');
    });
  });

  describe('generatePresignedUrl', () => {
    it('should generate presigned URL with headers', async () => {
      const client = new R2Client(mockEnv);

      const result = await client.generatePresignedUrl('test/file.txt', 'text/plain');

      expect(result.url).toContain('test-account-id.r2.cloudflarestorage.com');
      expect(result.url).toContain('test-bucket');
      expect(result.url).toContain('test/file.txt');
      expect(result.headers['Content-Type']).toBe('text/plain');
      expect(result.headers['Authorization']).toBeDefined();
      expect(result.headers['x-amz-date']).toBeDefined();
    });

    it('should use custom expiration time', async () => {
      const client = new R2Client(mockEnv);

      const result = await client.generatePresignedUrl('test/file.txt', 'text/plain', 7200);

      expect(result).toBeDefined();
      expect(result.headers).toBeDefined();
    });
  });

  describe('getObject', () => {
    it('should get object successfully', async () => {
      const client = new R2Client(mockEnv);
      const mockResponse = new Response('file content', { status: 200 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await client.getObject('test/file.txt');

      expect(result.status).toBe(200);
      expect(await result.text()).toBe('file content');
    });

    it('should throw error when object not found', async () => {
      const client = new R2Client(mockEnv);
      const mockResponse = new Response('Not found', { status: 404 });
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(client.getObject('test/nonexistent.txt'))
        .rejects.toThrow('R2 get object failed');
    });
  });

  describe('getPublicUrl', () => {
    it('should return custom public URL when configured', () => {
      const client = new R2Client(mockEnv);
      const url = client.getPublicUrl('test/file.txt');
      expect(url).toBe('https://test.r2.dev/test/file.txt');
    });

    it('should return default R2 URL when custom URL not configured', () => {
      const envWithoutPublicUrl = { ...mockEnv, CLOUDFLARE_R2_PUBLIC_URL: undefined };
      const client = new R2Client(envWithoutPublicUrl);
      const url = client.getPublicUrl('test/file.txt');
      expect(url).toContain('pub-test-account-id.r2.dev/test/file.txt');
    });
  });

  describe('extractKeyFromUrl', () => {
    it('should extract key from direct R2 URL', () => {
      const url = 'https://pub-xxx.r2.dev/test/file.txt';
      const key = R2Client.extractKeyFromUrl(url);
      expect(key).toBe('test/file.txt');
    });

    it('should extract key from proxy URL with key parameter', () => {
      const url = 'https://example.com/document-access?key=test%2Ffile.txt';
      const key = R2Client.extractKeyFromUrl(url);
      expect(key).toBe('test/file.txt');
    });

    it('should extract key from proxy URL with url parameter', () => {
      const url = 'https://example.com/document-access?url=https%3A%2F%2Fpub-xxx.r2.dev%2Ftest%2Ffile.txt';
      const key = R2Client.extractKeyFromUrl(url);
      expect(key).toBe('test/file.txt');
    });

    it('should extract key from custom domain URL', () => {
      const url = 'https://custom.domain.com/test/file.txt';
      const key = R2Client.extractKeyFromUrl(url);
      expect(key).toBe('test/file.txt');
    });

    it('should return null for invalid URL', () => {
      const url = 'not-a-valid-url';
      const key = R2Client.extractKeyFromUrl(url);
      expect(key).toBeNull();
    });
  });
});
