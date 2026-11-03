export const emptyOpportunityFilters = () => ({
  employmentType: [] as string[],
  experienceLevel: [] as string[],
  mode: [] as string[],
  skills: [] as string[],
  department: [] as string[],
  salaryMin: '',
  salaryMax: '',
  postedWithin: '',
});
export function salaryFilterError(min: string, max: string) {
  const valid = (value: string) =>
    value === '' ||
    (/^\d+$/.test(value) && Number.isSafeInteger(Number(value)));
  if (!valid(min) || !valid(max))
    return 'Enter non-negative whole amounts in rupees.';
  if (min !== '' && max !== '' && Number(min) > Number(max))
    return 'Maximum salary must be at least the minimum salary.';
  return '';
}
export function readOpportunitySearch(params: URLSearchParams) {
  const filters = emptyOpportunityFilters();
  for (const key of [
    'employmentType',
    'experienceLevel',
    'mode',
    'skills',
    'department',
  ] as const)
    filters[key] = params.getAll(key).slice(0, 30);
  for (const key of ['salaryMin', 'salaryMax', 'postedWithin'] as const)
    filters[key] = params.get(key) || '';
  if (salaryFilterError(filters.salaryMin, filters.salaryMax)) {
    filters.salaryMin = '';
    filters.salaryMax = '';
  }
  if (!['', '1', '7', '30'].includes(filters.postedWithin))
    filters.postedWithin = '';
  const rawPage = Number(params.get('page'));
  return {
    filters,
    page: Number.isSafeInteger(rawPage) && rawPage > 0 && rawPage <= 16667 ? rawPage : 1,
    sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest',
    view: params.get('view') === 'list' ? 'list' : 'grid',
    query: (params.get('q') || '').slice(0, 200),
    tab: [
      'my-jobs',
      'my-applications',
      'industrial-visits',
      'history',
    ].includes(params.get('tab') || '')
      ? params.get('tab')
      : null,
  };
}
