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
import type { PagesEnv } from '../../../lib/types';

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
  private client!: AwsClient;
  private endpoint!: string;
  private bucketName: string;
  private publicUrl?: string;
  private r2Bucket?: PagesEnv['R2_BUCKET']; // R2 binding if available

  /**
   * Create a new R2 client instance
   * @param env - Pages environment variables containing R2 credentials
   * @throws {Error} If neither R2 binding nor valid credentials are configured
   */
  constructor(env: PagesEnv) {
    try {
      // Check if R2 binding is available (preferred method)
      this.r2Bucket = env.R2_BUCKET;
      
      // Try to initialize with S3 API credentials
      this.initializeS3Client(env);
      
      // Set bucket configuration
      this.bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'skill-echosystem';
      this.publicUrl = env.CLOUDFLARE_R2_PUBLIC_URL;
      
    } catch (error) {
      // Re-throw with additional context
      throw new Error(
        `Failed to initialize R2 client: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Initialize S3 API client with proper credential validation
   * @private
   */
  private initializeS3Client(env: PagesEnv): void {
    // If R2 binding is not available, we MUST have valid credentials
    if (!this.r2Bucket) {
      this.validateAndSetCredentials(env, true);
      return;
    }
    
    // R2 binding is available - S3 credentials are optional (for fallback)
    try {
      this.validateAndSetCredentials(env, false);
    } catch (error) {
      // R2 binding available but no valid S3 API credentials
      // Set placeholder values - operations will use binding only
      console.warn(
        '[R2Client] R2 binding available but S3 API credentials not configured. ' +
        'Fallback to S3 API will not be available.'
      );
      this.client = new AwsClient({
        accessKeyId: 'R2_BINDING_ONLY',
        secretAccessKey: 'R2_BINDING_ONLY',
      });
      this.endpoint = 'https://r2-binding-only.r2.cloudflarestorage.com';
    }
  }

  /**
   * Validate and set S3 API credentials
   * @private
   * @param env - Environment variables
   * @param required - Whether credentials are required (true if no R2 binding)
   * @throws {Error} If required credentials are missing or invalid
   */
  private validateAndSetCredentials(env: PagesEnv, required: boolean): void {
    // Check for missing credentials
    const missingVars: string[] = [];
    
    if (!env.CLOUDFLARE_ACCOUNT_ID) {
      missingVars.push('CLOUDFLARE_ACCOUNT_ID');
    }
    if (!env.CLOUDFLARE_R2_ACCESS_KEY_ID) {
      missingVars.push('CLOUDFLARE_R2_ACCESS_KEY_ID');
    }
    if (!env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
      missingVars.push('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    }
    
    if (missingVars.length > 0) {
      const errorMessage = `Missing R2 credentials: ${missingVars.join(', ')}`;
      
      if (required) {
        throw new Error(
          `${errorMessage}. ` +
          `Either provide these credentials or configure R2_BUCKET binding in wrangler.toml. ` +
          `See: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/`
        );
      }
      
      // Optional credentials are missing - throw to trigger fallback to binding-only mode
      throw new Error(errorMessage);
    }
    
    // Validate credentials are not empty or whitespace-only
    const accessKeyId = env.CLOUDFLARE_R2_ACCESS_KEY_ID!.trim();
    const secretAccessKey = env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!.trim();
    
    if (accessKeyId === '') {
      throw new Error('CLOUDFLARE_R2_ACCESS_KEY_ID cannot be empty or whitespace');
    }
    
    if (secretAccessKey === '') {
      throw new Error('CLOUDFLARE_R2_SECRET_ACCESS_KEY cannot be empty or whitespace');
    }
    
    // Credentials are valid - initialize AWS client
    this.client = new AwsClient({
      accessKeyId,
      secretAccessKey,
    });
    
    this.endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
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
    // Use R2 binding if available (preferred for large files in dev)
    if (this.r2Bucket) {
      try {
        await this.r2Bucket.put(key, body, {
          httpMetadata: {
            contentType: contentType,
            contentDisposition: additionalHeaders?.['Content-Disposition']
          }
        });
        return this.getPublicUrl(key);
      } catch (bindingError) {
        console.error('[R2Client] R2 binding upload failed, falling back to S3 API:', bindingError);
        // Check if S3 API credentials are available for fallback
        if (this.endpoint === 'https://r2-binding-only.r2.cloudflarestorage.com') {
          throw new Error(
            'R2 binding upload failed and no S3 API credentials configured for fallback. ' +
            'Original error: ' + (bindingError instanceof Error ? bindingError.message : String(bindingError))
          );
        }
        // Fall through to S3 API method
      }
    }

    // Fallback to S3 API
    if (this.endpoint === 'https://r2-binding-only.r2.cloudflarestorage.com') {
      throw new Error('S3 API credentials not configured. Cannot perform upload without R2 binding or valid credentials.');
    }
    
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

    return this.getPublicUrl(key);
  }

  /**
   * Delete a file from R2
   * @param key - The file key (path) in R2
   */
  async delete(key: string): Promise<void> {
    // Check if S3 API is configured before attempting delete
    if (this.endpoint === 'https://r2-binding-only.r2.cloudflarestorage.com') {
      throw new Error('S3 API credentials not configured. Cannot perform delete without valid credentials.');
    }
    
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
    // Check if S3 API is configured before attempting list
    if (this.endpoint === 'https://r2-binding-only.r2.cloudflarestorage.com') {
      throw new Error('S3 API credentials not configured. Cannot perform list operation without valid credentials.');
    }
    
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
    const contentsBlocks = xmlText.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g);
    
    for (const block of contentsBlocks) {
      const inner = block[1];
      objects.push({
        key: inner.match(/<Key>([^<]+)<\/Key>/)?.[1] ?? '',
        size: parseInt(inner.match(/<Size>([^<]+)<\/Size>/)?.[1] ?? '0', 10),
        lastModified: new Date(inner.match(/<LastModified>([^<]+)<\/LastModified>/)?.[1] ?? ''),
        etag: inner.match(/<ETag>"?([^<"]+)"?<\/ETag>/)?.[1] ?? '',
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
    contentType: string
  ): Promise<{ url: string; headers: Record<string, string> }> {
    // Check if S3 API is configured before attempting to generate presigned URL
    if (this.endpoint === 'https://r2-binding-only.r2.cloudflarestorage.com') {
      throw new Error('S3 API credentials not configured. Cannot generate presigned URLs without valid credentials.');
    }
    
    // Add X-Amz-Expires to the URL BEFORE signing
    const uploadUrl = new URL(`${this.endpoint}/${this.bucketName}/${key}`);
    uploadUrl.searchParams.set('X-Amz-Expires', expiresIn.toString());

    const uploadRequest = new Request(uploadUrl.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
    });

    // Sign with query parameters instead of Authorization header
    const signedRequest = await this.client.sign(uploadRequest, {
      aws: {
        signQuery: true,
      },
    });

    return {
      url: signedRequest.url,
      headers: { 'Content-Type': contentType },
    };
  }

  /**
   * Generate a presigned URL for downloading/viewing a file
   * @param key - The file key (path) in R2
   * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour, max: 604800 = 7 days)
   * @returns The presigned URL for accessing the file
   */
  async generatePresignedGetUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // Check if S3 API is configured before attempting to generate presigned URL
    if (this.endpoint === 'https://r2-binding-only.r2.cloudflarestorage.com') {
      throw new Error('S3 API credentials not configured. Cannot generate presigned URLs without valid credentials.');
    }
    
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
   * @param range - Optional range header for partial content (e.g., "bytes=0-1023")
   * @returns Response object containing the file content
   */
  async getObject(key: string, range?: string): Promise<Response> {
    // Validate range BEFORE try/catch so bad input throws to the caller
    let r2Range: { offset: number; length: number } | undefined;
    if (range) {
      const match = range.match(/^bytes=(\d+)-(\d+)$/);
      if (!match) {
        throw new Error(`Invalid Range header format: "${range}". Expected "bytes=start-end"`);
      }
      const start = parseInt(match[1], 10);
      const end   = parseInt(match[2], 10);
      if (start > end) {
        throw new Error(`Invalid range: start (${start}) must be <= end (${end})`);
      }
      r2Range = { offset: start, length: end - start + 1 };
    }

    // Use R2 binding if available
    if (this.r2Bucket) {
      try {
        const object = await this.r2Bucket.get(key, r2Range ? { range: r2Range } : undefined);
        
        if (!object) {
          throw new Error(`R2 get object failed: 404 - Not Found`);
        }

        return new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'Content-Length': object.size.toString(),
            'ETag': object.httpEtag,
          }
        });
      } catch (bindingError) {
        console.error('[R2Client] R2 binding get failed, falling back to S3 API:', bindingError);
        // Check if S3 API credentials are available for fallback
        if (this.endpoint === 'https://r2-binding-only.r2.cloudflarestorage.com') {
          throw new Error(
            'R2 binding get failed and no S3 API credentials configured for fallback. ' +
            'Original error: ' + (bindingError instanceof Error ? bindingError.message : String(bindingError))
          );
        }
        // Fall through to S3 API method
      }
    }

    // Fallback to S3 API
    if (this.endpoint === 'https://r2-binding-only.r2.cloudflarestorage.com') {
      throw new Error('S3 API credentials not configured. Cannot perform get operation without valid credentials.');
    }
    
    const downloadUrl = `${this.endpoint}/${this.bucketName}/${key}`;

    const headers: Record<string, string> = {};
    if (range) {
      headers['Range'] = range;
    }

    const downloadRequest = new Request(downloadUrl, {
      method: 'GET',
      headers,
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
        const key = urlObj.searchParams.get('key');
        return key ? decodeURIComponent(key) : null;
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
