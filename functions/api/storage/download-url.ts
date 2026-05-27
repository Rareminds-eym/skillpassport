/**
 * Storage Download URL Endpoint
 *
 * Generates a signed download URL for private files in Supabase Storage.
 * Requires SSO authentication. Validates path ownership.
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

interface DownloadUrlRequest {
  bucket: string;
  path: string;
  /** Expiry in seconds. Default: 3600 (1 hour). Max: 86400 (24 hours). */
  expiresIn?: number;
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;

  let body: DownloadUrlRequest;
  try {
    body = await context.request.json() as DownloadUrlRequest;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.bucket || !body.path) {
    return Response.json({ error: 'bucket and path are required' }, { status: 400 });
  }

  // Validate path ownership: users can only download their own files unless admin
  const isAdmin = user.roles.some((r: string) =>
    ['admin', 'owner', 'school_admin', 'college_admin', 'university_admin'].includes(r)
  );

  if (!isAdmin && !body.path.startsWith(`${user.id}/`)) {
    return Response.json({ error: 'Forbidden: cannot access this path' }, { status: 403 });
  }

  const expiresIn = Math.min(body.expiresIn || 3600, 86400);
  const supabase = getServiceClient(env as any);

  const { data, error } = await supabase.storage
    .from(body.bucket)
    .createSignedUrl(body.path, expiresIn);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    signedUrl: data.signedUrl,
    expiresIn,
  });
});
