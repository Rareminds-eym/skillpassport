/**
 * R2 Client Wrapper
 * Provides a clean interface for R2 storage operations using aws4fetch
 * 
 * This client handles:
 * - File uploads to R2
 * - File deletions from R2
 * - Listing files with prefix
 * - Generating presigned URLs
 * - Getting objects from R2
 */

import { AwsClient } from 'aws4fetch';
import type { PagesEnv } from '../../../../src/functions-lib/types';

/**
 * R2 object metadata returned from list operations
 */
export interface R2Object {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
}

/**
 * R2 Client for Cloudflare R2 storage operations
 * Uses AWS Signature V4 authentication via aws4fetch
 */
export class R2Client {
  private client: AwsClient;
  private endpoint: string;
  private bucketName: string;
  private publicUrl?: string;

  /**
   * Create a new R2 client instance
   * @param env - Pages environment variables containing R2 credentials
   */
  constructor(env: PagesEnv) {
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_R2_ACCESS_KEY_ID || !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
      throw new Error('R2 credentials not configured. Required: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    }

    this.client = new AwsClient({
      accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    });

    this.endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    this.bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'skill-echosystem';
    this.publicUrl = env.CLOUDFLARE_R2_PUBLIC_URL;
  }

  /**
   * Upload a file to R2
   * @param key - The file key (path) in R2
   * @param body - The file content as ArrayBuffer
   * @param contentType - The MIME type of the file
   * @param additionalHeaders - Optional additional headers (e.g., Content-Disposition)
   * @returns The public URL of the uploaded file
   */
  async upload(
    key: string,
    body: ArrayBuffer,
    contentType: string,
    additionalHeaders?: Record<string, string>
  ): Promise<string> {
    const uploadUrl = `${this.endpoint}/${this.bucketName}/${key}`;

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      ...additionalHeaders,
    };

    const uploadRequest = new Request(uploadUrl, {
      method: 'PUT',
      body,
      headers,
      // @ts-ignore - duplex is required for Node.js fetch with body
      duplex: 'half',
    });

    const signedRequest = await this.client.sign(uploadRequest);
    const response = await fetch(signedRequest);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`R2 upload failed: ${response.status} - ${errorText}`);
    }

    // Return the public URL
    return this.getPublicUrl(key);
  }

  /**
   * Delete a file from R2
   * @param key - The file key (path) in R2
   */
  async delete(key: string): Promise<void> {
    const deleteUrl = `${this.endpoint}/${this.bucketName}/${key}`;

    const deleteRequest = new Request(deleteUrl, {
      method: 'DELETE',
    });

    const signedRequest = await this.client.sign(deleteRequest);
    const response = await fetch(signedRequest);

    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      throw new Error(`R2 delete failed: ${response.status} - ${errorText}`);
    }
  }

  /**
   * List objects in R2 with a given prefix
   * @param prefix - The prefix to filter objects (e.g., 'courses/123/')
   * @param maxKeys - Maximum number of keys to return (default: 1000)
   * @returns Array of R2 objects matching the prefix
   */
  async list(prefix: string, maxKeys: number = 1000): Promise<R2Object[]> {
    const listUrl = `${this.endpoint}/${this.bucketName}?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=${maxKeys}`;

    const listRequest = new Request(listUrl, {
      method: 'GET',
    });

    const signedRequest = await this.client.sign(listRequest);
    const response = await fetch(signedRequest);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`R2 list failed: ${response.status} - ${errorText}`);
    }

    const xmlText = await response.text();

    // Parse XML response (simple parsing for S3-compatible list response)
    const objects: R2Object[] = [];
    const keyMatches = xmlText.matchAll(/<Key>([^<]+)<\/Key>/g);
    const sizeMatches = xmlText.matchAll(/<Size>([^<]+)<\/Size>/g);
    const lastModMatches = xmlText.matchAll(/<LastModified>([^<]+)<\/LastModified>/g);
    const etagMatches = xmlText.matchAll(/<ETag>"?([^<"]+)"?<\/ETag>/g);

    const keys = Array.from(keyMatches, m => m[1]);
    const sizes = Array.from(sizeMatches, m => parseInt(m[1], 10));
    const lastMods = Array.from(lastModMatches, m => new Date(m[1]));
    const etags = Array.from(etagMatches, m => m[1]);

    for (let i = 0; i < keys.length; i++) {
      objects.push({
        key: keys[i],
        size: sizes[i] || 0,
        lastModified: lastMods[i] || new Date(),
        etag: etags[i] || '',
      });
    }

    return objects;
  }

  /**
   * Generate a presigned URL for uploading a file
   * @param key - The file key (path) in R2
   * @param contentType - The MIME type of the file
   * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
   * @returns Object containing the presigned URL and headers needed for upload
   */
  async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<{ url: string; headers: Record<string, string> }> {
    const uploadUrl = `${this.endpoint}/${this.bucketName}/${key}`;

    const uploadRequest = new Request(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
    });

    const signedRequest = await this.client.sign(uploadRequest);

    // Extract the signed URL and headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };

    // Copy authentication headers from signed request
    const authHeader = signedRequest.headers.get('Authorization');
    const dateHeader = signedRequest.headers.get('x-amz-date');

    if (authHeader) headers['Authorization'] = authHeader;
    if (dateHeader) headers['x-amz-date'] = dateHeader;

    return {
      url: signedRequest.url,
      headers,
    };
  }

  /**
   * Generate a presigned URL for downloading/viewing a file
   * @param key - The file key (path) in R2
   * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour, max: 604800 = 7 days)
   * @returns The presigned URL for accessing the file
   */
  async generatePresignedGetUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // Ensure expiresIn doesn't exceed 7 days (604800 seconds)
    const validExpiresIn = Math.min(expiresIn, 604800);
    
    // Add X-Amz-Expires to the URL BEFORE signing
    const downloadUrl = new URL(`${this.endpoint}/${this.bucketName}/${key}`);
    downloadUrl.searchParams.set('X-Amz-Expires', validExpiresIn.toString());

    const downloadRequest = new Request(downloadUrl.toString(), {
      method: 'GET',
    });

    // Sign with query parameters instead of Authorization header
    const signedRequest = await this.client.sign(downloadRequest, {
      aws: {
        signQuery: true,
      },
    });
    
    return signedRequest.url;
  }

  /**
   * Get an object from R2
   * @param key - The file key (path) in R2
   * @returns Response object containing the file content
   */
  async getObject(key: string): Promise<Response> {
    const downloadUrl = `${this.endpoint}/${this.bucketName}/${key}`;

    const downloadRequest = new Request(downloadUrl, {
      method: 'GET',
    });

    const signedRequest = await this.client.sign(downloadRequest);
    const response = await fetch(signedRequest);

    if (!response.ok) {
      throw new Error(`R2 get object failed: ${response.status} - ${response.statusText}`);
    }

    return response;
  }

  /**
   * Get the public URL for a file key
   * @param key - The file key (path) in R2
   * @returns The public URL for accessing the file
   */
  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    // Fallback to default R2 public URL format
    const accountId = this.endpoint.split('//')[1].split('.')[0];
    return `https://pub-${accountId}.r2.dev/${key}`;
  }

  /**
   * Extract file key from various URL formats
   * Supports:
   * - Direct R2 URLs: https://pub-xxx.r2.dev/path/to/file
   * - Custom domain URLs: https://custom.domain.com/path/to/file
   * - Proxy URLs: /document-access?url=... or /document-access?key=...
   * 
   * @param url - The URL to extract the key from
   * @returns The extracted file key, or null if extraction fails
   */
  static extractKeyFromUrl(url: string): string | null {
    try {
      // Handle direct key parameter
      if (url.includes('?key=')) {
        const urlObj = new URL(url);
        return decodeURIComponent(urlObj.searchParams.get('key') || '');
      }

      // Handle proxy URL with url parameter
      if (url.includes('?url=')) {
        const urlObj = new URL(url);
        const originalUrl = decodeURIComponent(urlObj.searchParams.get('url') || '');
        return R2Client.extractKeyFromUrl(originalUrl);
      }

      // Handle direct R2 URLs
      if (url.includes('.r2.dev/')) {
        const parts = url.split('.r2.dev/');
        if (parts.length > 1) {
          return parts[1];
        }
      }

      // Handle custom domain URLs - extract path after domain
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      // Remove leading slash
      return pathname.startsWith('/') ? pathname.substring(1) : pathname;
    } catch (error) {
      console.error('Failed to extract key from URL:', error);
      return null;
    }
  }
}
