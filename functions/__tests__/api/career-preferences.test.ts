import { beforeEach, expect, it, vi } from 'vitest';
import { careerPreferencesSchema } from '../../../shared/contracts/career-preferences';
const f = vi.hoisted(() => ({ id: '33333333-3333-4333-8333-333333333333', fail: false, saved: null as any, rpc: vi.fn() }));
vi.mock('../../lib/auth', () => ({ withAuth: (handler: any) => handler, getContextUser: () => ({ id: 'actor' }) }));
vi.mock('../../lib/supabase', () => ({ getServiceClient: () => ({
  from: (table: string) => { const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: table === 'learners' ? { id: f.id } : f.saved, error: f.fail ? { code: 'outage' } : null }) }; return q; }, rpc: f.rpc,
}) }));
import { onRequest } from '../../api/learners/career-preferences';
const request = (method = 'GET', body?: unknown) => onRequest({ request: new Request('https://fixture.invalid/api/learners/career-preferences', { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }), env: {} } as any);
beforeEach(() => { f.fail = false; f.saved = null; f.rpc.mockReset().mockImplementation(async (_name, args) => ({ data: { learnerId: args.p_learner_id, preferences: args.p_preferences, inputRevision: '2', preferencesRevision: '11111111-1111-4111-8111-111111111111' }, error: null })); });
it('returns empty defaults only when the owned preferences record is absent', async () => {
  const response = await request();
  expect(response.headers.get('Cache-Control')).toContain('no-store');
  expect((await response.json() as any).data.preferences).toMatchObject({ locations: [], willingToRelocate: null, strictLocations: false, useAssessmentRecommendations: true, useVerifiedLearning: true });
});
it('persists validated choices for the authenticated owner and returns the revision acknowledgment', async () => {
  const response = await request('PUT', { learnerId: f.id, expectedRevision: null, preferences: { targetRoles: [' Python developer ', 'python developer'], locations: ['Chennai'], strictLocations: true } });
  expect(response.status).toBe(200);
  expect(f.rpc).toHaveBeenCalledWith('save_learner_career_preferences_v2', expect.objectContaining({ p_user_id: 'actor', p_learner_id: f.id, p_preferences: expect.objectContaining({ targetRoles: ['Python developer'] }) }));
  expect((await response.json() as any).data.inputRevision).toBe('2');
});
it('rejects a foreign or previous account learner before writing', async () => {
  expect((await request('PUT', { learnerId: '44444444-4444-4444-8444-444444444444', expectedRevision: null, preferences: {} })).status).toBe(409);
  expect(f.rpc).not.toHaveBeenCalled();
});
it.each([{ strictLocations: true }, { workModes: ['office'] }, { userId: 'foreign' }, { locations: Array(21).fill('city') }, { targetRoles: ['x'.repeat(101)] }])('rejects invalid preferences %j', async preferences => {
  expect((await request('PUT', { learnerId: f.id, expectedRevision: null, preferences })).status).toBe(400);
  expect(f.rpc).not.toHaveBeenCalled();
});
it('preserves source failures instead of returning defaults', async () => { f.fail = true; expect((await request()).status).toBe(503); });
it('rejects malformed stored preferences', async () => { f.saved = { preferences: { strictLocations: true }, revision: '11111111-1111-4111-8111-111111111111' }; expect((await request()).status).toBe(503); });
it('does not invent relocation consent', () => { expect(careerPreferencesSchema.parse({}).willingToRelocate).toBeNull(); });
it('returns the stored preference token with the owned record', async () => {
  f.saved = { preferences: {}, revision: '11111111-1111-4111-8111-111111111111' };
  expect((await (await request()).json() as any).data.preferencesRevision).toBe(f.saved.revision);
});
it('requires an explicit expected token even for initial creation', async () => {
  expect((await request('PUT', { learnerId: f.id, preferences: {} })).status).toBe(400);
  expect(f.rpc).not.toHaveBeenCalled();
});
it('passes the edited revision to the guarded writer and preserves stale-write conflicts', async () => {
  const expectedRevision = '11111111-1111-4111-8111-111111111111';
  f.rpc.mockResolvedValue({ data: null, error: { code: '40001' } });
  const response = await request('PUT', { learnerId: f.id, preferences: { useVerifiedLearning: true }, expectedRevision });
  expect(response.status).toBe(409); expect((await response.json() as any).error.code).toBe('PREFERENCES_CHANGED');
  expect(f.rpc).toHaveBeenCalledWith('save_learner_career_preferences_v2', expect.objectContaining({ p_expected_revision: expectedRevision }));
});

it('preserves saved false flags instead of replacing them with new defaults', async () => {
  f.saved = { preferences: { useAssessmentRecommendations: false, useVerifiedLearning: false }, revision: '11111111-1111-4111-8111-111111111111' };
  expect((await (await request()).json() as any).data.preferences).toMatchObject({ useAssessmentRecommendations: false, useVerifiedLearning: false });
});
