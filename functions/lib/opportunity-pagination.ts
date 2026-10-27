import type { PostgrestError } from '@supabase/supabase-js';

export function integerParam(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
  name: string,
) {
  if (value === null) return fallback;
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < min ||
    Number(value) > max
  )
    throw new Error(
      `${name} must be a whole number between ${min} and ${max}.`,
    );
  return Number(value);
}
export function paginationParams(params: URLSearchParams, defaultLimit = 10) {
  const limit = integerParam(
    params.get('limit'),
    defaultLimit,
    1,
    100,
    'limit',
  );
  const offset = integerParam(params.get('offset'), 0, 0, 100000, 'offset');
  const search = (params.get('search') || '').trim();
  if (search.length > 200)
    throw new Error('Search must be 200 characters or fewer.');
  const sort = params.get('sortBy') || 'newest';
  if (!['newest', 'oldest'].includes(sort))
    throw new Error('Invalid sort order.');
  return { limit, offset, search, sort };
}
export function literalContains(value: string) {
  return `%${value.replace(/[\\%_]/g, '\\$&')}%`;
}
interface PageQuery<T> extends PromiseLike<{
  data: T[] | null;
  error: PostgrestError | null;
  count: number | null;
}> {
  range(from: number, to: number): PageQuery<T>;
}
/** Preserve the true total when a bookmarked page is beyond the current results. */
export async function readPage<T>(
  query: PageQuery<T>,
  limit: number,
  offset: number,
) {
  let result = await query.range(offset, offset + limit - 1);
  if (result.error?.code === 'PGRST103' && offset > 0) {
    result = await query.range(0, 0);
    if (!result.error)
      return { data: [] as T[], count: result.count ?? 0, error: null };
  }
  return result;
}
