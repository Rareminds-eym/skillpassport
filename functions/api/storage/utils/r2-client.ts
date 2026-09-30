/**
 * Binding-only R2 client wrapper.
 *
 * Storage access must go through the R2_BUCKET binding configured in wrangler.toml.
 * Local Wrangler development uses Miniflare's local R2 storage by default.
 */

import type { PagesEnv } from '../../../lib/types';

/**
 * R2 object metadata returned from list operations.
 */
export interface R2Object {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
}

export class R2Client {
  private readonly r2Bucket: NonNullable<PagesEnv['R2_BUCKET']>;
  private readonly publicUrl?: string;

  constructor(env: PagesEnv) {
    if (!env.R2_BUCKET) {
      throw new Error('R2_BUCKET binding is not configured');
    }

    this.r2Bucket = env.R2_BUCKET;
    this.publicUrl = env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/+$/, '');
  }

  /**
   * Upload a file to R2.
   */
  async upload(
    key: string,
    body: ArrayBuffer,
    contentType: string,
    additionalHeaders?: Record<string, string>
  ): Promise<void> {
    await this.r2Bucket.put(key, body, {
      httpMetadata: {
        contentType,
        contentDisposition: additionalHeaders?.['Content-Disposition'],
      },
    });
  }

  /**
   * Delete a file from R2.
   */
  async delete(key: string): Promise<void> {
    await this.r2Bucket.delete(key);
  }

  /**
   * List objects in R2 with a given prefix.
   */
  async list(prefix: string, maxKeys: number = 1000): Promise<R2Object[]> {
    const result = await this.r2Bucket.list({
      prefix,
      limit: maxKeys,
    });

    return result.objects.map((object) => ({
      key: object.key,
      size: object.size,
      lastModified: object.uploaded,
      etag: object.etag,
    }));
  }

  /**
   * Get an object from R2.
   */
  async getObject(key: string, range?: string): Promise<Response> {
    let r2Range: { offset: number; length: number } | undefined;
    if (range) {
      const match = range.match(/^bytes=(\d+)-(\d+)$/);
      if (!match) {
        throw new Error(`Invalid Range header format: "${range}". Expected "bytes=start-end"`);
      }

      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);
      if (start > end) {
        throw new Error(`Invalid range: start (${start}) must be <= end (${end})`);
      }

      r2Range = { offset: start, length: end - start + 1 };
    }

    const object = await this.r2Bucket.get(key, r2Range ? { range: r2Range } : undefined);
    if (!object) {
      throw new Error('R2 get object failed: 404 - Not Found');
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Content-Length', object.size.toString());
    headers.set('ETag', object.httpEtag);

    if (range) {
      headers.set('Accept-Ranges', 'bytes');
      headers.set(
        'Content-Range',
        `bytes ${r2Range!.offset}-${r2Range!.offset + r2Range!.length - 1}/${object.size}`
      );
      return new Response(object.body as unknown as BodyInit, { status: 206, headers });
    }

    return new Response(object.body as unknown as BodyInit, { headers });
  }

  /**
   * Get the configured public URL for a file key.
   */
  getPublicUrl(key: string): string {
    if (!this.publicUrl) {
      throw new Error('Public URL not configured for R2 bucket');
    }

    return `${this.publicUrl}/${key.replace(/^\/+/, '')}`;
  }

  hasPublicUrl(): boolean {
    return Boolean(this.publicUrl);
  }

  /**
   * Extract file key from various URL formats.
   */
  static extractKeyFromUrl(url: string): string | null {
    const value = url.trim();
    if (!value) {
      return null;
    }

    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value) && !value.includes('?')) {
      return value.replace(/^\/+/, '');
    }

    try {
      if (value.includes('?key=')) {
        const urlObj = new URL(value);
        const key = urlObj.searchParams.get('key');
        return key ? decodeURIComponent(key) : null;
      }

      if (value.includes('?url=')) {
        const urlObj = new URL(value);
        const originalUrl = decodeURIComponent(urlObj.searchParams.get('url') || '');
        return R2Client.extractKeyFromUrl(originalUrl);
      }

      if (value.includes('.r2.dev/')) {
        const parts = value.split('.r2.dev/');
        if (parts.length > 1) {
          return parts[1];
        }
      }

      const urlObj = new URL(value);
      const pathname = urlObj.pathname;
      return pathname.startsWith('/') ? pathname.substring(1) : pathname;
    } catch (error) {
      console.error('Failed to extract key from URL:', error);
      return null;
    }
  }
}
