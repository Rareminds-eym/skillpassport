import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');
  const startTime = Date.now();

  try {
    switch (action) {
      case 'shortlist-tags-creators': {
        const [{ data: tagRows, error: tagErr }, { data: creatorRows, error: creatorErr }] = await Promise.all([
          supabase.from('shortlists').select('tags').not('tags', 'is', null),
          supabase.from('shortlists').select('created_by').not('created_by', 'is', null)
        ]);
        if (tagErr) return apiDbError(tagErr, context.request, { startTime });
        if (creatorErr) return apiDbError(creatorErr, context.request, { startTime });

        const tagsSet = new Set<string>();
        (tagRows || []).forEach((r: any) => {
          (r.tags || []).forEach((t: string) => tagsSet.add(t));
        });
        const tags = Array.from(tagsSet).sort((a, b) => a.localeCompare(b));

        const createdBy = Array.from(
          new Set((creatorRows || []).map((r: any) => r.created_by).filter(Boolean))
        ).sort((a: string, b: string) => String(a).localeCompare(String(b)));

        return apiSuccess({ tags, createdBy }, context.request, { startTime });
      }

      default:
        return apiSuccess({ tags: [], createdBy: [] }, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[recruiter-pipeline GET] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
