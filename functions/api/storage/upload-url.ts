/**
 * Storage Upload URL Endpoint
 *
 * Generates a signed upload URL for Supabase Storage.
 * Requires SSO authentication. Validates path ownership.
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess, apiError } from '../../lib/response';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

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

  const isAdmin = user.roles.some((r: string) =>
    ['admin', 'owner', 'school_admin', 'college_admin', 'university_admin'].includes(r)
  );

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
