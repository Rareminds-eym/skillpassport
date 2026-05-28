/**
 * Library API — books, issued, history, statistics
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const resource = url.searchParams.get('resource') || 'books';
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const tableMap: Record<string, string> = {
    books: 'library_books',
    issued: 'library_issued',
    history: 'library_history',
    statistics: 'library_statistics',
  };

  const table = tableMap[resource];
  if (!table) {
    return apiError(400, 'VALIDATION_ERROR', `Invalid resource: ${resource}`, context.request);
  }

  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact' })
    .eq('org_id', user.org_id)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  return apiSuccess({ data, total: count }, context.request);
});
