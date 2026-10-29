import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ learnerId: '33333333-3333-4333-8333-333333333333', fail: false, tables: [] as string[], rpc: vi.fn() }));
vi.mock('../../lib/auth', () => ({ withAuth: (handler: any) => handler, getContextUser: () => ({ id: 'actor' }) }));
vi.mock('../../lib/supabase', () => ({ getServiceClient: () => ({ rpc: f.rpc, from: (table: string) => {
  f.tables.push(table); const filters: Record<string, unknown> = {};
  const q: any = { select: () => q, eq: (key: string, value: unknown) => { filters[key] = value; return q; }, maybeSingle: async () => ({ data: table === 'learners' && filters.id === f.learnerId && filters.user_id === 'actor' ? { id: f.learnerId } : table === 'learner_career_preferences' ? { preferences: { useAssessmentRecommendations: false, useVerifiedLearning: false } } : null, error: f.fail ? { code: 'outage' } : null }) }; return q;
} }) }));
import { onRequest } from '../../api/learners/recommendation-revision';
const request = (learnerId = f.learnerId) => onRequest({ request: new Request(`https://fixture.invalid/api/learners/recommendation-revision?learnerId=${learnerId}`), env: {} } as any);
beforeEach(() => { f.fail = false; f.tables = []; f.rpc.mockReset().mockResolvedValue({ data: { inputRevision: '42', catalogRevision: '7' }, error: null }); });
it('returns private owned revision metadata without skills or vector work', async () => {
  const response = await request(); expect(response.status).toBe(200); expect(response.headers.get('Cache-Control')).toContain('no-store');
  expect((await response.json() as any).data).toMatchObject({ learnerId: f.learnerId, inputRevision: '42', catalogRevision: '7' });
  expect(f.tables).toEqual(['learners', 'learner_career_preferences']);
  expect(f.rpc).toHaveBeenCalledWith('get_recommendation_freshness_v1', { p_learner_id: f.learnerId, p_user_id: 'actor' });
});
it('rejects a foreign learner before reading preferences or revision state', async () => { expect((await request('44444444-4444-4444-8444-444444444444')).status).toBe(403); expect(f.tables).toEqual(['learners']); expect(f.rpc).not.toHaveBeenCalled(); });
it('preserves dependency outages', async () => { f.fail = true; expect((await request()).status).toBe(503); });
it('rejects malformed revision state', async () => { f.rpc.mockResolvedValue({ data: { inputRevision: '42', catalogRevision: null }, error: null }); expect((await request()).status).toBe(503); });
