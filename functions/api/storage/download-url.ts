/**
 * Storage Download URL Endpoint
 *
 * Generates a signed download URL for private files in Supabase Storage.
 * Requires SSO authentication. Validates path ownership.
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess, apiError } from '../../lib/response';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

interface DownloadUrlRequest {
  bucket: string;
  path: string;
  expiresIn?: number;
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;

  let body: DownloadUrlRequest;
  try {
    body = await context.request.json() as DownloadUrlRequest;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  if (!body.bucket || !body.path) {
    return apiError(400, 'VALIDATION_ERROR', 'bucket and path are required', context.request);
  }

  const isAdmin = user.roles.some((r: string) =>
    ['admin', 'company_admin', 'owner', 'school_admin', 'college_admin', 'university_admin'].includes(r)
  );

  if (!isAdmin && !body.path.startsWith(`${user.id}/`)) {
    return apiError(403, 'FORBIDDEN', 'Forbidden: cannot access this path', context.request);
  }

  const expiresIn = Math.min(body.expiresIn || 3600, 86400);
  const supabase = getServiceClient(env as any);

  const { data, error } = await supabase.storage
    .from(body.bucket)
    .createSignedUrl(body.path, expiresIn);

  if (error) {
    return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  }

  return apiSuccess({ signedUrl: data.signedUrl, expiresIn }, context.request);
});
