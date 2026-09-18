/**
 * Get File URL Handler - return an app-owned proxy URL for R2 files.
 *
 * R2 access is binding-only; this handler does not create S3 presigned URLs.
 */

import { apiSuccess, apiError } from '../../../lib/response';

export async function handleGetFileUrl(request: Request, env: Record<string, any>): Promise<Response> {
  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  const body = await request.json() as { fileKey?: string };
  const { fileKey } = body;
  
  if (!fileKey) {
    return apiError(400, 'VALIDATION_ERROR', 'fileKey is required', request);
  }

  if (!env.R2_BUCKET) {
    return apiError(500, 'INTERNAL_ERROR', 'R2_BUCKET binding is not configured', request);
  }

  const url = new URL(request.url);
  const proxyUrl = new URL(
    `/api/storage/document-access?key=${encodeURIComponent(fileKey)}&mode=inline`,
    url.origin
  ).toString();

  return apiSuccess({
    url: proxyUrl,
    expiresAt: null,
  }, request);
}
