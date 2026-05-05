/**
 * Library API — books, issued, history, statistics
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
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
    return Response.json({ error: `Invalid resource: ${resource}` }, { status: 400 });
  }

  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact' })
    .eq('org_id', user.org_id)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data, total: count });
});
