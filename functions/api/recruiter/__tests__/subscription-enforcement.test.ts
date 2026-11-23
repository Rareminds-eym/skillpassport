import { beforeEach, describe, expect, it, vi } from 'vitest';
const io = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), lifecycle: vi.fn(), permissions: vi.fn(), unlock: vi.fn(), view: vi.fn(), interviews: vi.fn() }));
const actor = 'a0000000-0000-4000-8000-000000000001', organization = 'b0000000-0000-4000-8000-000000000001';
const candidate = 'c0000000-0000-4000-8000-000000000001', learnerUser = 'd0000000-0000-4000-8000-000000000001';
vi.mock('../../../lib/auth', () => ({ withAuth: (handler: unknown) => handler,
  getContextUser: () => ({ id: actor, sub: actor, org_id: organization, roles: ['recruiter'] }) }));
vi.mock('../../../lib/supabase', () => ({ getServiceClient: () => ({ from: io.from, rpc: io.rpc }) }));
vi.mock('../../../lib/permissions', () => ({ verifyOrgAccess: async () => ({ allowed: true }), getUserRecruitmentRoles: vi.fn(),
  PERMISSIONS: { VIEW_CANDIDATES: 'view_candidates', MANAGE_CANDIDATES: 'manage_candidates' } }));
vi.mock('../../../lib/org-ownership', () => ({ getActiveOrgId: async () => organization,
  getOrgMemberUserIds: vi.fn(), getOrgOwnedOpportunityIds: vi.fn(), assertInterviewAccess: vi.fn(), getInterviewRow: vi.fn(),
  ALLOWED_REQUISITION_STATUSES: ['draft', 'open', 'closed'] }));
vi.mock('../../../shared/lib/subscription-access', () => ({ requireSubscriptionAccess: io.lifecycle,
  readRecruiterContactPermissions: io.permissions, unlockRecruiterCandidateContact: io.unlock, recruiterCandidateView: io.view,
  readRecruiterInterviewViews: io.interviews }));
import { onRequest as recruiter } from '../actions';
import { onRequest as opportunities } from '../../opportunities';
async function run(handler: typeof recruiter, action: string, body: Record<string, unknown> = {}) {
  return handler({ env: {}, data: { user: {} }, waitUntil: vi.fn(), request: new Request('https://synthetic.invalid/api/actions',
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, ...body }) }) });
}
beforeEach(() => {
  vi.resetAllMocks();
  io.lifecycle.mockResolvedValue({ current: { access: 'full' } });
  io.permissions.mockResolvedValue(new Map([[candidate, { visible: true, unlocked: false, email: false, phone: false, location: false }]]));
  io.view.mockReturnValue({ id: candidate, name: 'Synthetic learner', email: null, contact_number: null });
  io.interviews.mockResolvedValue([{id:'synthetic-interview',candidate_email:null,candidate_phone:null}]);
  const query: Record<string, unknown> = {};
  for (const name of ['select', 'eq', 'in', 'order', 'limit', 'insert', 'update', 'delete']) query[name] = vi.fn(() => query);
  query.maybeSingle = vi.fn(async () => ({ data: { id: candidate, user_id: learnerUser, email: 'private@synthetic.invalid', contact_number: 'private-phone' }, error: null }));
  query.then = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve({
    data: [{ id: candidate, user_id: learnerUser, email: 'private@synthetic.invalid', contact_number: 'private-phone' }], error: null,
  }).then(resolve, reject);
  io.from.mockReturnValue(query);
});
describe('actual recruiter endpoint subscription enforcement', () => {
  it.each(['create-requisition', 'update-requisition', 'delete-requisition', 'unlock-candidate-contact', 'import-requisitions'])('blocks %s mutations before resource writes', async action => {
    io.lifecycle.mockResolvedValue(Response.json({ error: 'Subscription request denied' }, { status: 403 }));
    expect((await run(recruiter, action)).status).toBe(403); expect(io.from).not.toHaveBeenCalled(); expect(io.rpc).not.toHaveBeenCalled();
    expect(io.lifecycle.mock.calls[0][0]).toMatchObject({ actorId: actor, subject: { kind: 'organization', id: organization }, mode: 'write' });
  });
  it('retains declared read semantics for candidate contact checks', async () => {
    io.lifecycle.mockResolvedValue(Response.json({ error: 'Suspended' }, { status: 403 }));
    expect((await run(recruiter, 'check-candidate-unlocked', { candidateId: candidate })).status).toBe(403);
    expect(io.lifecycle.mock.calls[0][0]).toMatchObject({ mode: 'read' }); expect(io.from).not.toHaveBeenCalled();
  });
  it('uses the scoped transactional unlock adapter rather than the legacy credit RPC', async () => {
    io.unlock.mockResolvedValue({ candidate: { id: candidate, name: 'Synthetic learner', email: null, phone: null }, alreadyUnlocked: false });
    expect((await run(recruiter, 'unlock-candidate-contact', { candidateId: candidate, organizationId: 'forged' })).status).toBe(200);
    expect(io.unlock).toHaveBeenCalledWith(expect.objectContaining({ actorId: actor, organizationId: organization }), candidate, expect.any(String));
    expect(io.rpc).not.toHaveBeenCalled();
  });
  it('applies consent-aware projection to list rows, including paid contact records', async () => {
    const response = await run(recruiter, 'list-learners');
    expect(response.status).toBe(200); expect(io.permissions).toHaveBeenCalled();
    expect(JSON.stringify(await response.json())).not.toContain('private@synthetic.invalid');
  });
  it('propagates missing contact authority before disclosing candidate fields', async () => {
    io.permissions.mockResolvedValue(Response.json({ error: 'Unavailable' }, { status: 503 }));
    expect((await run(recruiter, 'get-learner', { learnerId: candidate })).status).toBe(503);
  });
  it('routes recruiter interview reads through current paid consent before returning cached contacts', async () => {
    const response = await run(recruiter, 'list-interviews');
    expect(response.status).toBe(200); expect(io.interviews).toHaveBeenCalledWith(expect.objectContaining({organizationId:organization}),expect.any(Array));
    expect(JSON.stringify(await response.json())).not.toContain('private@synthetic.invalid');
  });
  it('propagates unavailable interview consent authority without returning raw rows', async () => {
    io.interviews.mockResolvedValue(Response.json({error:'Unavailable'},{status:503}));
    expect((await run(recruiter,'list-interviews')).status).toBe(503);
  });
  it('masks copied pipeline contact fields using the canonical consent projection',async()=>{
    const response=await run(opportunities,'get-pipeline-data-for-application',{learner_id:candidate,opportunity_id:'synthetic-job'});
    expect(response.status).toBe(200);expect(io.permissions).toHaveBeenCalled();
    expect(await response.json()).toMatchObject({data:{pipelineCandidate:{candidate_email:null,candidate_phone:null}}});
  });
  it('withholds a private canonical profile from pipeline disclosure',async()=>{
    io.permissions.mockResolvedValue(new Map([[candidate,{visible:false,email:false,phone:false,location:false}]]));
    const response=await run(opportunities,'get-pipeline-data-for-application',{learner_id:candidate,opportunity_id:'synthetic-job'});
    expect(response.status).toBe(200);expect(await response.json()).toMatchObject({data:{pipelineCandidate:null}});
  });
  it.each(['create-opportunity', 'update-opportunity', 'create-shortlist', 'boost-opportunity'])('blocks the opportunities alias %s after lifecycle denial', async action => {
    io.lifecycle.mockResolvedValue(Response.json({ error: 'Subscription request denied' }, { status: 403 }));
    expect((await run(opportunities, action)).status).toBe(403); expect(io.from).not.toHaveBeenCalled(); expect(io.rpc).not.toHaveBeenCalled();
  });
});
