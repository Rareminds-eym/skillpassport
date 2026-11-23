// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
type Candidate = { id: string; status: string; stage: string; learner_id: string; opportunity_id: string };
type Application = { application_status: string; learner_id: string; opportunity_id: string };
const f = vi.hoisted(() => ({ candidate: { id: 'candidate', status: 'rejected', stage: 'screened', learner_id: 'learner', opportunity_id: 'job' } as Candidate, application: { application_status: 'rejected', learner_id: 'learner', opportunity_id: 'job' } as Application | null, rpc: vi.fn(), writes: vi.fn() }));
vi.mock('../lib/auth', () => ({ withAuth: (fn: unknown) => fn, getContextUser: () => ({ id: 'recruiter' }) }));
vi.mock('../lib/pipelineNotifications', () => ({ notifyLearnerOfPipelineChange: vi.fn() }));
vi.mock('../lib/permissions', () => ({ verifyOrgAccess: async () => ({ allowed: true }), PERMISSIONS: { MANAGE_CANDIDATES: 'manage' } }));
vi.mock('../lib/org-ownership', () => ({ getActiveOrgId: async () => 'org', getOrgOwnedOpportunityIds: async () => ['job'], getOrgMemberUserIds: async () => ['recruiter'] }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({ rpc: f.rpc, from(table: string) {
  const value = () => table === 'zoho_recruiter_pipeline_candidates' ? f.candidate : table === 'zoho_recruiter_applied_jobs' ? f.application : null;
  class Query {
    select() { return this; }
    eq() { return this; }
    in() { return this; }
    limit() { return this; }
    update(...args: unknown[]) { f.writes(...args); return this; }
    insert(...args: unknown[]) { f.writes(...args); return this; }
    async maybeSingle() { return { data: value(), error: null }; }
    async single() { return { data: value(), error: null }; }
    then(resolve: (result: { data: unknown[]; error: null }) => unknown) {
      return Promise.resolve({ data: value() ? [value()] : [], error: null }).then(resolve);
    }
  }
  return new Query();
} }) }));
import { onRequest } from '../api/recruiter-pipeline/[[path]]';
const post = (body: unknown) => onRequest({ env: {}, request: new Request('https://app.test/api/recruiter-pipeline', { method: 'POST', body: JSON.stringify(body) }) });
beforeEach(() => { f.writes.mockReset(); f.rpc.mockReset(); f.rpc.mockImplementation(async (name: string) => ({ data: f.application?.application_status === 'rejected' || (name !== 'recruitment_add_pipeline_candidate' && (f.candidate.status === 'rejected' || f.candidate.stage === 'rejected')) || (!f.application && f.candidate.status === 'rejected') ? { code: 'APPLICATION_REJECTED', message: 'Explicit reset required' } : name === 'recruitment_add_pipeline_candidate' ? { candidate: { ...f.candidate, status: 'active' } } : { candidates: [f.candidate] }, error: null })); f.candidate = { id: 'candidate', status: 'rejected', stage: 'screened', learner_id: 'learner', opportunity_id: 'job' }; f.application = { application_status: 'rejected', learner_id: 'learner', opportunity_id: 'job' }; });
it('blocks implicit reactivation of a rejected job application', async () => {
  expect((await post({ action: 'add-candidate-to-pipeline', opportunity_id: 'job', learner_id: 'learner', candidate_name: 'Candidate' })).status).toBe(409);
  expect(f.writes).not.toHaveBeenCalled();
});
it('blocks normal stage moves after rejection', async () => {
  expect((await post({ action: 'move-candidate-to-stage', candidate_id: 'candidate', stage: 'screened' })).status).toBe(409);
  expect(f.writes).not.toHaveBeenCalled();
});
it('checks all bulk candidates before any write', async () => {
  expect((await post({ action: 'bulk-move-candidates', candidate_ids: ['candidate'], stage: 'screened' })).status).toBe(409);
  expect(f.writes).not.toHaveBeenCalled();
});
it('permits reactivation after the application has been explicitly reset', async () => {
  f.application = { application_status: 'applied', learner_id: 'learner', opportunity_id: 'job' };
  expect((await post({ action: 'add-candidate-to-pipeline', opportunity_id: 'job', learner_id: 'learner', candidate_name: 'Candidate' })).status).toBe(200);
  expect(f.rpc).toHaveBeenCalledWith('recruitment_add_pipeline_candidate', expect.objectContaining({ p_actor: 'recruiter', p_org: 'org' }));
  expect(f.writes).not.toHaveBeenCalled();
});

it.each(['move-candidate-to-stage', 'bulk-move-candidates'])('does not silently reopen a rejected pipeline in %s merely because application state differs', async action => {
  f.candidate.stage = 'rejected';
  f.application = { application_status: 'under_review', learner_id: 'learner', opportunity_id: 'job' };
  expect((await post({ action, candidate_id: 'candidate', candidate_ids: ['candidate'], stage: 'screened' })).status).toBe(409);
  expect(f.writes).not.toHaveBeenCalled();
});
it.each(['move-candidate-to-stage', 'bulk-move-candidates'])('keeps a rejected pipeline-only candidate blocked in %s', async action => {
  f.application = null;
  expect((await post({ action, candidate_id: 'candidate', candidate_ids: ['candidate'], stage: 'screened' })).status).toBe(409);
  expect(f.writes).not.toHaveBeenCalled();
});

it('uses the atomic decision for single moves and exposes its concurrent rejection', async () => {
  f.candidate.status = 'active'; f.candidate.stage = 'sourced';
  f.application = { application_status: 'applied', learner_id: 'learner', opportunity_id: 'job' };
  f.rpc.mockResolvedValueOnce({ data: { code: 'APPLICATION_REJECTED', message: 'Rejected before decision lock' }, error: null });
  expect((await post({ action: 'move-candidate-to-stage', candidate_id: 'candidate', stage: 'screened' })).status).toBe(409);
  expect(f.rpc).toHaveBeenCalledWith('recruitment_move_pipeline_candidates', expect.objectContaining({ p_org: 'org', p_actor: 'recruiter', p_ids: ['candidate'], p_stage: 'screened' }));
  expect(f.writes).not.toHaveBeenCalled();
});
it('does not switch to non-atomic writes if the RPC is unavailable', async () => {
  f.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Function missing' } });
  expect((await post({ action: 'bulk-move-candidates', candidate_ids: ['candidate'], stage: 'screened' })).status).toBe(500);
  expect(f.writes).not.toHaveBeenCalled();
});
it('returns the committed candidate after an eligible atomic move', async () => {
  f.candidate.status = 'active'; f.candidate.stage = 'sourced'; f.application = null;
  expect((await post({ action: 'move-candidate-to-stage', candidate_id: 'candidate', stage: 'screened' })).status).toBe(200);
  expect(f.writes).not.toHaveBeenCalled();
});
