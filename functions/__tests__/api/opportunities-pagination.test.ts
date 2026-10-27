import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({
  calls: [] as any[],
  results: {} as Record<string, any>,
  rpc: vi.fn(),
}));
vi.mock('../../lib/auth', () => ({
  withAuth: (fn: unknown) => fn,
  getContextUser: () => ({ id: 'own-user' }),
}));
vi.mock('../../lib/supabase', () => ({
  getServiceClient: () => ({
    rpc: f.rpc,
    from: (table: string) => {
      const call = { table, ops: [] as any[] };
      f.calls.push(call);
      const query: any = {
        then: (resolve: any) =>
          Promise.resolve(
            f.results[table] || { data: [], count: 0, error: null },
          ).then(resolve),
      };
      for (const method of [
        'select',
        'neq',
        'eq',
        'in',
        'or',
        'ilike',
        'order',
        'range',
      ])
        query[method] = (...args: any[]) => {
          call.ops.push([method, ...args]);
          return query;
        };
      query.maybeSingle = () => Promise.resolve(f.results[table]);
      return query;
    },
  }),
}));
import { onRequestGet as details } from '../../api/opportunities/application-details';
import { onRequestGet as membership } from '../../api/opportunities/membership';
import { onRequestGet as visits } from '../../api/opportunities/visits';
import { onRequestGet as applications } from '../../api/opportunities/applications';
import { paginationParams, readPage } from '../../lib/opportunity-pagination';
const context = (path: string) =>
  ({
    request: new Request(`https://app.invalid/api/opportunities/${path}`),
    env: {},
  }) as any;
beforeEach(() => {
  f.calls = [];
  f.results = { learners: { data: { id: 'own-learner' }, error: null } };
  vi.clearAllMocks();
});
it.each([
  'limit=0',
  'limit=101',
  'limit=6x',
  'offset=2.5',
  'offset=100001',
  'offset=1e3',
  'sortBy=invalid',
])('rejects unsafe pagination %s', async (query) => {
  expect((await visits(context(`visits?${query}`))).status).toBe(400);
  expect(f.calls).toHaveLength(0);
});
it('filters visits before a bounded range and uses a deterministic tie-breaker', async () => {
  f.results.opportunities = { data: [{ id: 'visit' }], count: 23, error: null };
  const r = await visits(
    context('visits?limit=10&offset=10&sector=Engineering&search=Delhi%25'),
  );
  const body: any = await r.json();
  expect(body.data.total).toBe(23);
  expect(body.data.visits).toHaveLength(1);
  expect(f.calls[0].ops).toEqual(
    expect.arrayContaining([
      ['eq', 'employment_type', 'factory_visit'],
      ['eq', 'sector', 'Engineering'],
      ['order', 'id', { ascending: false }],
      ['range', 10, 19],
    ]),
  );
  const or = f.calls[0].ops.find((op: any) => op[0] === 'or')[1];
  expect(or).toContain(JSON.stringify('%Delhi\\%%'));
});
it('aggregates visit facets in SQL instead of fetching catalog rows', async () => {
  f.rpc.mockResolvedValue({
    data: { sectors: ['Engineering'], locations: ['Delhi'] },
    error: null,
  });
  expect((await visits(context('visits?facets=true'))).status).toBe(200);
  expect(f.rpc).toHaveBeenCalledWith('opportunity_visit_facets');
  expect(f.calls).toHaveLength(0);
});
it('derives learner scope from the verified user and bounds related enrichment to the application page', async () => {
  f.results.applied_jobs = {
    data: [
      { id: 'a', opportunity_id: 'page-job', opportunity: { id: 'page-job' } },
    ],
    count: 17,
    error: null,
  };
  const r = await applications(
    context(
      'applications?learnerId=foreign&limit=10&offset=10&status=applied&search=Engineer',
    ),
  );
  const body: any = await r.json();
  expect(body.data.total).toBe(17);
  expect(f.calls.find((c) => c.table === 'learners').ops).toContainEqual([
    'eq',
    'user_id',
    'own-user',
  ]);
  expect(f.calls.find((c) => c.table === 'applied_jobs').ops).toContainEqual([
    'eq',
    'learner_id',
    'own-learner',
  ]);
  expect(f.calls.find((c) => c.table === 'applied_jobs').ops).toContainEqual([
    'or',
    expect.any(String),
    { referencedTable: 'opportunity' },
  ]);
  for (const table of ['pipeline_candidates', 'interviews'])
    expect(f.calls.find((c) => c.table === table).ops).toContainEqual([
      'in',
      'opportunity_id',
      ['page-job'],
    ]);
  expect(f.calls.find((c) => c.table === 'interviews').ops).toContainEqual([
    'eq',
    'learner_id',
    'own-user',
  ]);
});
it('does not fetch unrelated enrichment when an application page is empty', async () => {
  expect((await applications(context('applications'))).status).toBe(200);
  expect(f.calls.map((c) => c.table)).toEqual(['learners', 'applied_jobs']);
});
it('denies applications without an owned learner profile', async () => {
  f.results.learners = { data: null, error: null };
  expect((await applications(context('applications'))).status).toBe(404);
  expect(f.calls.map((c) => c.table)).toEqual(['learners']);
});
it('recovers an out-of-range total without returning the first page as the requested page', async () => {
  const results = [
    { data: null, error: { code: 'PGRST103' }, count: null },
    { data: [{ id: 'first' }], error: null, count: 13 },
  ];
  const query: any = {
    range: vi.fn(() => query),
    then: (resolve: any) => Promise.resolve(results.shift()).then(resolve),
  };
  const result = await readPage(query, 10, 100);
  expect(result).toEqual({ data: [], count: 13, error: null });
  expect(query.range.mock.calls).toEqual([
    [100, 109],
    [0, 0],
  ]);
});
it('accepts documented defaults and exact page boundaries', () => {
  expect(paginationParams(new URLSearchParams())).toEqual({
    limit: 10,
    offset: 0,
    search: '',
    sort: 'newest',
  });
  expect(
    paginationParams(new URLSearchParams('limit=100&offset=100000')),
  ).toMatchObject({ limit: 100, offset: 100000 });
});

it('looks up membership only for requested jobs and the verified learner', async () => {
  const id = '00000000-0000-4000-8000-000000000001';
  expect(
    (await membership(context(`membership?ids=${id}&learnerId=foreign`)))
      .status,
  ).toBe(200);
  for (const table of ['applied_jobs', 'saved_jobs']) {
    const call = f.calls.find((c) => c.table === table);
    expect(call.ops).toContainEqual(['eq', 'learner_id', 'own-learner']);
    expect(call.ops).toContainEqual(['in', 'opportunity_id', [id]]);
    expect(call.ops).toContainEqual(['select', 'opportunity_id']);
  }
});
it('rejects unbounded or malformed membership requests before querying', async () => {
  expect((await membership(context('membership?ids=not-an-id'))).status).toBe(
    400,
  );
  expect(f.calls).toHaveLength(0);
});

it('scopes visit history in the database before counting and pagination', async () => {
  expect((await applications(context('applications?kind=visits'))).status).toBe(
    200,
  );
  expect(f.calls.find((c) => c.table === 'applied_jobs').ops).toContainEqual([
    'eq',
    'opportunity.employment_type',
    'factory_visit',
  ]);
});

it('allows an owned closed opening to be read through its application without exposing another learner', async () => {
  const id = '00000000-0000-4000-8000-000000000001';
  f.results.applied_jobs = {
    data: { id, opportunity: { status: 'closed', is_active: false } },
    error: null,
  };
  const response = await details(
    context(`application-details?id=${id}&learnerId=foreign`),
  );
  expect(response.status).toBe(200);
  const ops = f.calls.find((c) => c.table === 'applied_jobs').ops;
  expect(ops).toContainEqual(['eq', 'id', id]);
  expect(ops).toContainEqual(['eq', 'learner_id', 'own-learner']);
  expect(ops).not.toContainEqual(['eq', 'status', 'open']);
  expect(response.headers.get('Cache-Control')).toContain('no-store');
});
it('returns no application details when the owned lookup has no matching application', async () => {
  f.results.applied_jobs = { data: null, error: null };
  expect(
    (
      await details(
        context('application-details?id=00000000-0000-4000-8000-000000000001'),
      )
    ).status,
  ).toBe(404);
});
it('filters job applications in the database before counting', async () => {
  expect((await applications(context('applications?kind=jobs'))).status).toBe(
    200,
  );
  expect(f.calls.find((c) => c.table === 'applied_jobs').ops).toContainEqual([
    'neq',
    'opportunity.employment_type',
    'factory_visit',
  ]);
});
