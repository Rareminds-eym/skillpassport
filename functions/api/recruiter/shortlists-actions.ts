import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed } from '../../lib/response';

export const onRequest = async (context: any) => {
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action } = body;

  if (action === 'list') {
    const {
      searchQuery,
      advancedFilters = {},
      sortField = 'created_date',
      sortDirection = 'desc',
    } = body;

    const buildQuery = (from: 'shortlists_with_counts' | 'shortlists') => {
      const baseSelect = from === 'shortlists'
        ? '*, shortlist_candidates(count)'
        : '*';
      let query: any = supabase.from(from).select(baseSelect);

      if (searchQuery) {
        const q = searchQuery.trim();
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,created_by.ilike.%${q}%`);
      }

      if (advancedFilters.status?.length > 0) {
        query = query.in('status', advancedFilters.status);
      }

      if (advancedFilters.shared === 'shared') {
        query = query.eq('shared', true);
      } else if (advancedFilters.shared === 'private') {
        query = query.eq('shared', false);
      }

      if (advancedFilters.tags?.length > 0) {
        query = query.overlaps('tags', advancedFilters.tags);
      }

      if (advancedFilters.createdBy?.length > 0) {
        query = query.in('created_by', advancedFilters.createdBy);
      }

      if (advancedFilters.dateRange?.startDate) {
        query = query.gte('created_date', advancedFilters.dateRange.startDate);
      }
      if (advancedFilters.dateRange?.endDate) {
        query = query.lte('created_date', advancedFilters.dateRange.endDate);
      }

      if (from === 'shortlists_with_counts' && advancedFilters.candidateCountRange && advancedFilters.candidateCountRange !== 'all') {
        const map: Record<string, { min: number; max: number | null }> = {
          '0': { min: 0, max: 0 },
          '1-5': { min: 1, max: 5 },
          '6-20': { min: 6, max: 20 },
          '21-50': { min: 21, max: 50 },
          '50+': { min: 51, max: null },
        };
        const r = map[advancedFilters.candidateCountRange];
        if (r) {
          query = query.gte('candidate_count', r.min);
          if (r.max !== null) {
            query = query.lte('candidate_count', r.max);
          }
        }
      }

      const asc = sortDirection === 'asc';
      if (sortField === 'candidate_count') {
        if (from === 'shortlists_with_counts') {
          query = query.order('candidate_count', { ascending: asc });
        }
      } else if (sortField === 'share_expiry') {
        query = query.order('share_expiry', { ascending: asc, nullsFirst: !asc });
      } else {
        query = query.order(sortField, { ascending: asc });
      }

      return query;
    };

    let usingView = true;
    let { data, error } = await buildQuery('shortlists_with_counts');
    if (error) {
      usingView = false;
      ({ data, error } = await buildQuery('shortlists'));
    }
    if (error) return apiDbError(error, context.request);

    const rows = (data as any[]) || [];
    const formatted = rows.map((item: any) => ({
      ...item,
      candidate_count: item.candidate_count ?? (item.shortlist_candidates?.[0]?.count ?? 0),
    }));

    if (!usingView && sortField === 'candidate_count') {
      formatted.sort((a: any, b: any) => {
        const diff = (a.candidate_count || 0) - (b.candidate_count || 0);
        return sortDirection === 'asc' ? diff : -diff;
      });
    }

    return apiSuccess(formatted, context.request);
  }

  return apiError(400, 'BAD_REQUEST', `Unknown action: ${action}`, context.request);
});
