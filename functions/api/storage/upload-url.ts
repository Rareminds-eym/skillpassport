/**
 * Storage Upload URL Endpoint
 *
 * Generates a signed upload URL for Supabase Storage.
 * Requires SSO authentication. Validates path ownership.
 */
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiError, apiSuccess } from '../../lib/response';
import { ADMIN_ROLES } from '../../lib/roleCategories';
import { getServiceClient } from '../../lib/supabase';

interface UploadUrlRequest {
  bucket: string;
  path: string;
  contentType?: string;
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;

  let body: UploadUrlRequest;
  try {
    body = await context.request.json() as UploadUrlRequest;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  if (!body.bucket || !body.path) {
    return apiError(400, 'VALIDATION_ERROR', 'bucket and path are required', context.request);
  }

  // Ownership-scoped: non-admins may only upload to their own path prefix.
  // Admins (shared ADMIN_ROLES group) bypass the ownership constraint. This is a
  // non-guard role check, so it uses ADMIN_ROLES (not requireAdmin) per the
  // RBAC guard-matrix — replacing the prior inline admin literal (bug §7.1).
  const isAdmin = user.roles.some((r: string) => ADMIN_ROLES.includes(r));

  if (!isAdmin && !body.path.startsWith(`${user.id}/`)) {
    return apiError(403, 'FORBIDDEN', 'Forbidden: cannot upload to this path', context.request);
  }

  const supabase = getServiceClient(env as any);

  const { data, error } = await supabase.storage
    .from(body.bucket)
    .createSignedUploadUrl(body.path);

  if (error) {
    return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  }

  return apiSuccess({
    signedUrl: data.signedUrl,
    path: data.path,
    token: data.token,
  }, context.request);
});
