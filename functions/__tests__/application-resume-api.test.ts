// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ learner: null as unknown, opportunity: null as unknown, inserts: vi.fn(), updates: vi.fn(), head: vi.fn(), calls: [] as unknown[] }));
vi.mock('../lib/auth', () => ({ withAuth: (fn: unknown) => fn, getContextUser: () => ({ id: 'owner', sub: 'owner', roles: ['learner'] }) }));
vi.mock('../lib/supabase', () => ({ getServiceClient: () => ({ from(table: string) {
  class Query {
    select() { return this; }
    eq(...args: unknown[]) { f.calls.push(args); return this; }
    update(data: unknown) { f.updates(data); return this; }
    insert(data: unknown) { f.inserts(data); return this; }
    async single() { return { data: { id: 'application' }, error: null }; }
    async maybeSingle() { return { data: table === 'learners' ? f.learner : table === 'opportunities' ? f.opportunity : null, error: null }; }
    then(resolve: (value: unknown) => unknown) {
      return Promise.resolve({ data: null, error: null }).then(resolve);
    }
  }
  return new Query();
} }) }));
import { onRequest } from '../api/opportunities/index';
const post = (body: unknown) => onRequest({ env: { R2_BUCKET: { head: f.head } }, request: new Request('https://app.test/api/opportunities', { method: 'POST', body: JSON.stringify(body) }) });
beforeEach(() => { vi.clearAllMocks(); f.calls = []; f.learner = { id: 'learner', resumeUrl: null }; f.opportunity = null; });
it('blocks direct application requests with no resume before inserting an application', async () => {
  const response = await post({ action: 'apply-to-job', learner_id: 'learner', opportunity_id: 'job' });
  expect(response.status).toBe(400);
  expect(JSON.stringify(await response.json())).toContain('RESUME_REQUIRED');
  expect(f.calls).toContainEqual(['user_id', 'owner']);
  expect(f.inserts).not.toHaveBeenCalled();
});
it('rejects resume operations without an owned learner', async () => {
  f.learner = null;
  expect((await post({ action: 'set-application-resume', learner_id: 'foreign', resume_url: 'uploads/owner/resume.pdf' })).status).toBe(403);
  expect(f.head).not.toHaveBeenCalled();
  expect(f.updates).not.toHaveBeenCalled();
});
it('attaches an owned validated resume to the profile', async () => {
  f.head.mockResolvedValue({ size: 100, httpMetadata: { contentType: 'application/pdf' } });
  expect((await post({ action: 'set-application-resume', learner_id: 'learner', resume_url: 'uploads/owner/resume.pdf' })).status).toBe(200);
  expect(f.updates).toHaveBeenCalledWith({ resumeUrl: 'https://app.test/api/storage/document-access?key=uploads%2Fowner%2Fresume.pdf&mode=inline' });
});

it('stamps application pipeline ownership from the job rather than client or learner tenant', async () => {
  f.learner = { id: 'learner', name: 'Synthetic learner', resumeUrl: 'uploads/owner/resume.pdf' };
  f.opportunity = { id: 'job', organization_id: 'employer-org', status: 'open', is_active: true };
  f.head.mockResolvedValue({ size: 100, httpMetadata: { contentType: 'application/pdf' } });
  const response = await post({ action: 'apply-to-job', learner_id: 'learner', opportunity_id: 'job', organization_id: 'attacker-org' });
  expect(response.status).toBe(200);
  expect(f.inserts).toHaveBeenCalledWith([expect.objectContaining({ opportunity_id: 'job', learner_id: 'learner', organization_id: 'employer-org' })]);
  expect(f.inserts).not.toHaveBeenCalledWith([expect.objectContaining({ organization_id: 'attacker-org' })]);
});
