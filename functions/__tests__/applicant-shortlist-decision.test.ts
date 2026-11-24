// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ rpc: vi.fn(), insert: vi.fn(), allowed: true, list: { id: 'list', organization_id: 'org', created_by: 'recruiter' } }));
vi.mock('../lib/auth', () => ({ withAuth: (fn: unknown) => fn, getContextUser: () => ({ id: 'recruiter' }) }));
vi.mock('../lib/permissions', () => ({ verifyOrgAccess: async () => ({ allowed: f.allowed }), PERMISSIONS: { MANAGE_CANDIDATES: 'manage_candidates', VIEW_CANDIDATES: 'view_candidates' } }));
vi.mock('../lib/org-ownership', () => ({ getActiveOrgId: async () => 'org', getOrgMemberUserIds: async () => ['recruiter'] }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({ rpc: f.rpc, from() {
  const q = { select: () => q, eq: () => q, limit: () => q,
    insert(data: unknown) { f.insert(data); return q; },
    maybeSingle: async () => ({ data: f.list, error: null }),
    single: async () => ({ data: { id: 'membership' }, error: null }),
  }; return q;
} }) }));
import { onRequest } from '../api/opportunities/index';
const post = (body: unknown) => onRequest({ env: {}, request: new Request('https://app.test/api/opportunities', { method: 'POST', body: JSON.stringify(body) }) });
const applicant = { action: 'add-application-to-shortlist', application_id: 'application', shortlist_id: 'list', learner_id: 'learner', added_by: 'attacker' };
beforeEach(() => { vi.clearAllMocks(); f.allowed = true; f.list.organization_id = 'org'; f.rpc.mockResolvedValue({ data: { data: { id: 'membership' } }, error: null }); });
it('uses the atomic applicant decision with the authenticated organization and actor', async () => {
  expect((await post(applicant)).status).toBe(200);
  expect(f.rpc).toHaveBeenCalledWith('recruitment_shortlist_application', { p_org: 'org', p_actor: 'recruiter', p_application: 'application', p_shortlist: 'list', p_learner: 'learner', p_notes: null });
  expect(f.insert).not.toHaveBeenCalled();
});
it.each([['APPLICATION_REJECTED',409],['NOT_FOUND',404],['FORBIDDEN',403]])('exposes atomic decision %s without inserting', async (code,status) => {
  f.rpc.mockResolvedValue({ data: { code, message: 'Decision denied' }, error: null });
  expect((await post(applicant)).status).toBe(status);
  expect(f.insert).not.toHaveBeenCalled();
});
it('does not switch to a generic insertion when the atomic function is unavailable', async () => {
  f.rpc.mockResolvedValue({ data: null, error: { message: 'Function missing' } });
  expect((await post(applicant)).status).toBe(500);
  expect(f.insert).not.toHaveBeenCalled();
});
it('requires application context and rejects foreign lists or unauthorized actors before a decision', async () => {
  expect((await post({ ...applicant, application_id: undefined })).status).toBe(400);
  f.list.organization_id = 'foreign'; expect((await post(applicant)).status).toBe(403);
  f.allowed = false; expect((await post(applicant)).status).toBe(403);
  expect(f.rpc).not.toHaveBeenCalled(); expect(f.insert).not.toHaveBeenCalled();
});
it('preserves independent talent-list insertion with a server-owned actor', async () => {
  expect((await post({ action: 'add-candidate-to-shortlist', shortlist_id: 'list', learner_id: 'learner', added_by: 'attacker' })).status).toBe(200);
  expect(f.rpc).not.toHaveBeenCalled();
  expect(f.insert).toHaveBeenCalledWith([{ shortlist_id: 'list', learner_id: 'learner', added_by: 'recruiter', notes: undefined }]);
});
