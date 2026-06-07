/**
 * Storage Download URL Endpoint
 *
 * Generates a signed download URL for private files in Supabase Storage.
 * Requires SSO authentication. Validates path ownership.
 */
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { ADMIN_ROLES } from '../../lib/roleCategories';
import { getServiceClient } from '../../lib/supabase';

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

  // Ownership-scoped: non-admins may only access their own path prefix. Admins
  // (shared ADMIN_ROLES group) bypass the ownership constraint. Non-guard role
  // check → uses ADMIN_ROLES (not requireAdmin), replacing the prior inline
  // admin literal (bug §7.1).
  const isAdmin = user.roles.some((r: string) => ADMIN_ROLES.includes(r));

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
