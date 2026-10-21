// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from '../actions';
const mocks = vi.hoisted(() => ({ from: vi.fn(), access: vi.fn(), roles: vi.fn(), members: vi.fn(), notify: vi.fn(), quota: vi.fn() }));
vi.mock('../../../lib/auth', () => ({ withAuth: (handler: unknown) => handler, getContextUser: () => ({ id: 'user-1', sub: 'user-1', org_id: 'org-1' }) }));
vi.mock('../../../lib/supabase', () => ({ getServiceClient: () => ({ from: mocks.from }) }));
vi.mock('../../../lib/newOpportunityNotifications', () => ({ notifyLearnersOfNewOpportunity: mocks.notify }));
vi.mock('../../../shared/lib/entitlement-service', () => ({ getNumericLimit: mocks.quota }));
vi.mock('../../../lib/permissions', () => ({ verifyOrgAccess: mocks.access, getUserRecruitmentRoles: mocks.roles, PERMISSIONS: { CREATE_JOBS: 'create_jobs', EDIT_JOBS: 'edit_jobs', DELETE_JOBS: 'delete_jobs', MANAGE_CANDIDATES: 'manage_candidates', VIEW_CANDIDATES: 'view_candidates' } }));
vi.mock('../../../lib/org-ownership', () => ({ getActiveOrgId: () => 'org-1', getOrgMemberUserIds: mocks.members, getOrgOwnedOpportunityIds: vi.fn(), assertInterviewAccess: vi.fn(), getInterviewRow: vi.fn(), ALLOWED_REQUISITION_STATUSES: ['draft', 'open', 'closed', 'on_hold'] }));
let chain: Record<string, ReturnType<typeof vi.fn>>;
let existing: Record<string, unknown>;
const valid = { job_title: 'Engineer', company_name: 'Example', department: 'Engineering', location: 'Remote', employment_type: 'Full-time', description: 'Build systems', status: 'draft' };
async function request(body: unknown) {
  return onRequest({ request: new Request('http://localhost/api/recruiter/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), env: {}, data: { user: {} } });
}
beforeEach(() => {
  vi.clearAllMocks();
  existing = { id: 'job-1', organization_id: 'org-1', created_by: 'user-1', status: 'draft', is_active: false, salary_range_min: 100, salary_range_max: 200 };
  chain = Object.fromEntries(['select', 'eq', 'insert', 'update', 'delete', 'maybeSingle', 'single'].map(key => [key, vi.fn()]));
  for (const key of ['select', 'eq', 'insert', 'update', 'delete']) chain[key].mockReturnValue(chain);
  chain.maybeSingle.mockImplementation(async () => ({ data: existing, error: null }));
  chain.single.mockResolvedValue({ data: { ...existing, ...valid }, error: null });
  mocks.from.mockReturnValue(chain);
  mocks.access.mockResolvedValue({ allowed: true });
  mocks.roles.mockResolvedValue([{ can_create_jobs: true, can_edit_jobs: true, can_delete_jobs: false }]);
  mocks.members.mockResolvedValue(['user-1']);
  mocks.quota.mockResolvedValue({ enabled: true, limit: 5 });
});

describe('Requisition API', () => {
  it('creates with authenticated ownership and ignores spoofed counters', async () => {
    const response = await request({ action: 'create-requisition', requisitionData: { ...valid, organization_id: 'foreign', created_by: 'foreign', applications_count: 9, is_active: true } });
    expect(response.status).toBe(200);
    expect(mocks.access).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1', 'create_jobs');
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ title: 'Engineer', organization_id: 'org-1', created_by: 'user-1', applications_count: 0, is_active: false }));
  });
  it.each(['create-requisition', 'update-requisition', 'delete-requisition', 'delete-opportunity'])('denies %s without mutation permission', async action => {
    mocks.access.mockResolvedValue({ allowed: false });
    const response = await request({ action, id: 'job-1', requisitionData: valid, updates: { description: 'Changed' } });
    expect(response.status).toBe(403);
    expect(chain.insert).not.toHaveBeenCalled(); expect(chain.update).not.toHaveBeenCalled(); expect(chain.delete).not.toHaveBeenCalled();
  });
  it('rejects edits of foreign requisitions', async () => {
    existing.organization_id = 'foreign';
    expect((await request({ action: 'update-requisition', id: 'job-1', updates: { description: 'Changed' } })).status).toBe(403);
    expect(chain.update).not.toHaveBeenCalled();
  });
  it('validates an edited salary against the unchanged bound', async () => {
    const response = await request({ action: 'update-requisition', id: 'job-1', updates: { salary_range_min: 300 } });
    expect(response.status).toBe(400); expect(chain.update).not.toHaveBeenCalled();
  });
  it('saves recruiter clearing and salary clearing instead of silently discarding them', async () => {
    const response = await request({ action: 'update-requisition', id: 'job-1', updates: { recruiter_id: null, salary_range_min: null } });
    expect(response.status).toBe(200);
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ recruiter_id: null, salary_range_min: null }));
  });
  it('rejects assignment to recruiters outside the organization', async () => {
    const recruiterChain = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: 'foreign-user' }, error: null }) };
    recruiterChain.select.mockReturnValue(recruiterChain); recruiterChain.eq.mockReturnValue(recruiterChain);
    mocks.from.mockImplementation(table => table === 'recruiters' ? recruiterChain : chain);
    const response = await request({ action: 'update-requisition', id: 'job-1', updates: { recruiter_id: '00000000-0000-4000-8000-000000000001' } });
    expect(response.status).toBe(400); expect(chain.update).not.toHaveBeenCalled();
  });
  it('publishing checks quota and preserves omitted deadline and salary fields', async () => {
    chain.eq.mockReturnValueOnce(chain).mockReturnValueOnce(chain).mockReturnValueOnce(chain);
    // A quota denial must stop before the counting or update paths.
    mocks.quota.mockResolvedValue(null);
    const response = await request({ action: 'update-requisition', id: 'job-1', updates: { status: 'open' } });
    expect(response.status).toBe(402); expect(chain.update).not.toHaveBeenCalled();
  });
  it('deletes an owned requisition when the organization grants delete permission', async () => {
    chain.eq.mockImplementation(() => chain.delete.mock.calls.length ? Promise.resolve({ error: null }) : chain);
    const response = await request({ action: 'delete-requisition', id: 'job-1' });
    expect(response.status).toBe(200);
    expect(chain.delete).toHaveBeenCalledOnce();
    expect(chain.eq).toHaveBeenLastCalledWith('id', 'job-1');
    expect(mocks.access).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1', 'delete_jobs');
  });
  it('returns an actionable conflict when a foreign key protects hiring records', async () => {
    chain.eq.mockImplementation(() => chain.delete.mock.calls.length ? Promise.resolve({ error: { code: '23503' } }) : chain);
    const response = await request({ action: 'delete-requisition', id: 'job-1' });
    expect(response.status).toBe(409);
    expect((await response.json()).error.message).toContain('Close the opening');
  });
  it('returns permissions from existing organization roles', async () => {
    const response = await request({ action: 'get-requisition-permissions' });
    expect((await response.json()).data).toEqual({ create: true, edit: true, delete: false, manageCandidates: false });
  });
});


describe('Application review API', () => {
  const opportunityId = '11111111-1111-4111-8111-111111111111';
  const applicationId = '22222222-2222-4222-8222-222222222222';
  const updatedAt = '2026-10-19T09:00:00Z';
  const input = { action: 'review-application', id: applicationId, opportunityId, expectedStatus: 'applied', expectedUpdatedAt: updatedAt, status: 'under_review', note: 'Initial screening' };
  let applicationChain: Record<string, ReturnType<typeof vi.fn>>;
  beforeEach(() => {
    existing.id = opportunityId;
    applicationChain = Object.fromEntries(['select', 'eq', 'update', 'maybeSingle'].map(key => [key, vi.fn()]));
    for (const key of ['select', 'eq', 'update']) applicationChain[key].mockReturnValue(applicationChain);
    applicationChain.maybeSingle.mockResolvedValueOnce({ data: { id: applicationId, application_status: 'applied', updated_at: updatedAt, notes: 'Prior review', viewed_at: null }, error: null }).mockResolvedValue({ data: { id: applicationId, application_status: 'under_review', updated_at: '2026-10-19T10:00:00Z' }, error: null });
    mocks.from.mockImplementation(table => table === 'applied_jobs' ? applicationChain : chain);
  });
  it('requires candidate-management permission and preserves history with a server-stamped entry', async () => {
    const response = await request(input);
    expect(response.status).toBe(200);
    expect(mocks.access).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1', 'manage_candidates');
    expect(applicationChain.update).toHaveBeenCalledWith(expect.objectContaining({ application_status: 'under_review', notes: expect.stringContaining('Prior review\n[') }));
    expect(applicationChain.update.mock.calls[0][0].notes).toContain('applied → under_review by user-1: Initial screening');
    expect(applicationChain.eq).toHaveBeenCalledWith('updated_at', updatedAt);
    expect(applicationChain.eq).toHaveBeenCalledWith('opportunity_id', opportunityId);
  });
  it('denies viewers without touching applications', async () => {
    mocks.access.mockResolvedValue({ allowed: false });
    expect((await request(input)).status).toBe(403); expect(applicationChain.update).not.toHaveBeenCalled();
  });
  it('requires the requisition to belong to the active organization', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null });
    expect((await request(input)).status).toBe(404); expect(applicationChain.update).not.toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
  });
  it('rejects an application that does not belong to this requisition', async () => {
    applicationChain.maybeSingle.mockReset().mockResolvedValue({ data: null, error: null });
    expect((await request(input)).status).toBe(404); expect(applicationChain.update).not.toHaveBeenCalled();
  });
  it('rejects a stale version before writing', async () => {
    expect((await request({ ...input, expectedUpdatedAt: '2026-10-18T09:00:00Z' })).status).toBe(409);
    expect(applicationChain.update).not.toHaveBeenCalled();
  });
  it('detects a concurrent write between reading and updating', async () => {
    applicationChain.maybeSingle.mockReset().mockResolvedValueOnce({ data: { id: applicationId, application_status: 'applied', updated_at: updatedAt }, error: null }).mockResolvedValue({ data: null, error: null });
    expect((await request(input)).status).toBe(409);
    expect(applicationChain.eq).toHaveBeenCalledWith('application_status', 'applied');
  });
  it.each(['accepted', 'withdrawn', 'offer_received', 'interview_scheduled'])('protects %s applications from direct review edits', async status => {
    expect((await request({ ...input, expectedStatus: status })).status).toBe(400);
    expect(applicationChain.update).not.toHaveBeenCalled();
  });
  it('requires a rejection reason before accessing the database', async () => {
    expect((await request({ ...input, status: 'rejected', note: '   ' })).status).toBe(400);
    expect(applicationChain.update).not.toHaveBeenCalled();
  });
  it('timestamps the initial view and ignores identity fields from the client', async () => {
    expect((await request({ ...input, status: 'viewed', learner_id: 'forged', created_by: 'forged' })).status).toBe(200);
    expect(applicationChain.update.mock.calls[0][0]).toHaveProperty('viewed_at');
    expect(applicationChain.update.mock.calls[0][0]).not.toHaveProperty('learner_id');
    expect(applicationChain.update.mock.calls[0][0]).not.toHaveProperty('created_by');
  });
});
