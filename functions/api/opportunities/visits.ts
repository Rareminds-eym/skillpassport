import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess, apiError, apiDbError } from '../../lib/response';
import {
  paginationParams,
  literalContains,
  readPage,
} from '../../lib/opportunity-pagination';

export const onRequestGet = withAuth(async (context) => {
  const params = new URL(context.request.url).searchParams;
  let page;
  const sector = params.get('sector') || '',
    location = params.get('location') || '';
  try {
    page = paginationParams(params);
    if (sector.length > 100 || location.length > 200)
      throw new Error('Invalid visit filters.');
  } catch (error) {
    return apiError(
      400,
      'VALIDATION_ERROR',
      (error as Error).message,
      context.request,
    );
  }
  const db = getServiceClient(context.env);
  if (params.get('facets') === 'true') {
    const { data, error } = await db.rpc('opportunity_visit_facets');
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }
  let query = db
    .from('opportunities')
    .select(
      'id,company_name,location,sector,description,title,posted_date,is_active,created_at,updated_at',
      { count: 'exact' },
    )
    .eq('employment_type', 'factory_visit')
    .eq('is_active', true);
  if (page.search)
    query = query.or(
      ['company_name', 'title', 'sector', 'location']
        .map(
          (column) =>
            `${column}.ilike.${JSON.stringify(literalContains(page.search))}`,
        )
        .join(','),
    );
  if (sector) query = query.eq('sector', sector);
  if (location) query = query.ilike('location', literalContains(location));
  const { data, error, count } = await readPage(
    query
      .order('posted_date', {
        ascending: page.sort === 'oldest',
        nullsFirst: false,
      })
      .order('id', { ascending: page.sort === 'oldest' }),
    page.limit,
    page.offset,
  );
  if (error) return apiDbError(error, context.request);
  const response = apiSuccess(
    {
      visits: data || [],
      total: count ?? 0,
      limit: page.limit,
      offset: page.offset,
    },
    context.request,
  );
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
});
