import { beforeEach, expect, it, vi } from 'vitest';

const f = vi.hoisted(() => ({
  user: '11111111-1111-4111-8111-111111111111',
  learner: '22222222-2222-4222-8222-222222222222',
  visit: '33333333-3333-4333-8333-333333333333',
  calls: [] as {table: string; ops: unknown[][]}[],
  results: {} as Record<string, {data: unknown; error: unknown}>,
}));
vi.mock('../../lib/auth', () => ({withAuth: (handler: unknown) => handler, getContextUser: () => ({id: f.user})}));
vi.mock('../../lib/supabase', () => ({getServiceClient: () => ({from(table: string) {
  const call = {table, ops: [] as unknown[][]};
  f.calls.push(call);
  const query: Record<string, any> = {};
  for (const method of ['select', 'eq', 'upsert']) query[method] = (...args: unknown[]) => {call.ops.push([method, ...args]); return query;};
  query.maybeSingle = async () => f.results[table];
  return query;
}})}));
import {onRequestPost} from '../../api/college-admin/events';
async function register(patch = {}) {
  return onRequestPost({request: new Request('http://app.test/api/college-admin/events', {
    method: 'POST', body: JSON.stringify({action: 'register-for-factory-visit', learner_id: f.learner, opportunity_id: f.visit, ...patch}),
  }), env: {}} as any);
}
beforeEach(() => {
  f.calls = [];
  f.results = {
    learners: {data: {id: f.learner}, error: null},
    opportunities: {data: {id: f.visit}, error: null},
    applied_jobs: {data: {id: 'registration'}, error: null},
  };
});
it('derives the learner from the verified actor and only registers an active visit', async () => {
  const response = await register();
  expect(response.status).toBe(200);
  expect((await response.json()).data).toEqual({id: 'registration', alreadyRegistered: false});
  expect(f.calls).toHaveLength(3);
  expect(f.calls[0].ops).toContainEqual(['eq', 'user_id', f.user]);
  expect(f.calls[0].ops).toContainEqual(['eq', 'is_deleted', false]);
  expect(f.calls[1].ops).toEqual(expect.arrayContaining([['eq', 'employment_type', 'factory_visit'], ['eq', 'is_active', true]]));
  expect(f.calls[2].ops).toContainEqual(['upsert', [expect.objectContaining({learner_id: f.learner, opportunity_id: f.visit})], {onConflict: 'learner_id,opportunity_id', ignoreDuplicates: true}]);
});
it('rejects another learner before reading the visit or writing registration', async () => {
  expect((await register({learner_id: '44444444-4444-4444-8444-444444444444'})).status).toBe(403);
  expect(f.calls.map(c => c.table)).toEqual(['learners']);
});
it('rejects missing learner ownership', async () => {
  f.results.learners.data = null;
  expect((await register()).status).toBe(403);
  expect(f.calls).toHaveLength(1);
});
it('does not register unavailable visits or regular job openings', async () => {
  f.results.opportunities.data = null;
  expect((await register()).status).toBe(404);
  expect(f.calls).toHaveLength(2);
});
it('treats an atomic duplicate-ignore result as successful registration', async () => {
  f.results.applied_jobs.data = null;
  const response = await register();
  expect(response.status).toBe(200);
  expect((await response.json()).data.alreadyRegistered).toBe(true);
});
it.each(['learners', 'opportunities', 'applied_jobs'])('does not report success after a %s outage', async table => {
  f.results[table] = {data: null, error: {code: 'XX000', message: 'private database details'}};
  const response = await register();
  expect(response.status).toBe(500);
  expect(JSON.stringify(await response.json())).not.toContain('private database details');
});
it.each([{learner_id: 'invalid'}, {opportunity_id: 'invalid'}, {learner_id: null}])('rejects malformed identifiers before database work', async input => {
  expect((await register(input)).status).toBe(400);
  expect(f.calls).toHaveLength(0);
});
