/**
 * Get File URL Handler - Generate presigned URLs for R2 files
 * 
 * Features:
 * - AWS signature v4 for R2
 * - 1-hour expiration
 * - Secure access to private files
 * 
 * Source: cloudflare-workers/course-api/src/index.ts (handleGetFileUrl)
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { AwsClient } from 'aws4fetch';

export async function handleGetFileUrl(request: Request, env: Record<string, any>): Promise<Response> {
  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  const body = await request.json() as { fileKey?: string };
  const { fileKey } = body;
  
  if (!fileKey) {
    return apiError(400, 'VALIDATION_ERROR', 'fileKey is required', request);
  }

  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_R2_ACCESS_KEY_ID || !env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    return apiError(500, 'INTERNAL_ERROR', 'R2 credentials not configured', request);
  }

  const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || 'skill-echosystem';
  const r2 = new AwsClient({
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  });

  const endpoint = `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const expiresIn = 3600; // 1 hour
  const expiration = Math.floor(Date.now() / 1000) + expiresIn;

  // Generate presigned URL
  const url = new URL(`${endpoint}/${bucketName}/${fileKey}`);
  url.searchParams.set('X-Amz-Expires', expiresIn.toString());

  const signedRequest = await r2.sign(
    new Request(url.toString(), { method: 'GET' }),
    { aws: { signQuery: true } }
  );

  return apiSuccess({
    url: signedRequest.url,
    expiresAt: new Date(expiration * 1000).toISOString(),
  }, request);
}
