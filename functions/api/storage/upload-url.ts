/**
 * Storage Upload URL Endpoint
 *
 * Generates a signed upload URL for Supabase Storage.
 * Requires SSO authentication. Validates path ownership.
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
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
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.bucket || !body.path) {
    return Response.json({ error: 'bucket and path are required' }, { status: 400 });
  }

  // Validate path ownership: users can only upload to their own paths unless admin
  const isAdmin = user.roles.some((r: string) =>
    ['admin', 'owner', 'school_admin', 'college_admin', 'university_admin'].includes(r)
  );

  if (!isAdmin && !body.path.startsWith(`${user.id}/`)) {
    return Response.json({ error: 'Forbidden: cannot upload to this path' }, { status: 403 });
  }

  const supabase = getServiceClient(env as any);

  const { data, error } = await supabase.storage
    .from(body.bucket)
    .createSignedUploadUrl(body.path);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    signedUrl: data.signedUrl,
    path: data.path,
    token: data.token,
  });
});
