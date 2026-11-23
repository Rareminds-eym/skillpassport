// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ gate: vi.fn(), writes: vi.fn(), filters: [] as unknown[][], row: { id: 'profile-id', user_id: 'sso-id', college_id: 'org', documents: [] as { url: string; name: string }[] }, missing: false, readError: false, disappeared: false }));
vi.mock('../lib/admin-feature-request', () => ({ requireAdminRequestFeature: f.gate }));
vi.mock('../lib/supabase', () => ({ createSupabaseAdminClient: () => ({ from(table: string) {
  const filters: [string, unknown][] = [];
  let updating = false;
  const q = {
    select: () => q,
    eq(key: string, value: unknown) { filters.push([key,value]); f.filters.push([table,key,value]); return q; },
    update(data: unknown) { updating = true; f.writes(data); return q; },
    maybeSingle: async () => table === 'organizations' ? { data: { id: 'org', organization_type: 'college' }, error: null }
      : { data: !(f.missing || (updating && f.disappeared)) && filters.every(([key,value]) => f.row[key as keyof typeof f.row] === value) ? f.row : null, error: f.readError ? { message: 'offline' } : null },
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
  }; return q;
} }) }));
import { handleUpdateLearnerDocuments } from '../api/user/handlers/authenticated';
const post = (identity: Record<string,string>, roles = ['college_admin']) => handleUpdateLearnerDocuments(new Request('https://app.test/api/user/update-learner-documents', { method: 'POST', body: JSON.stringify({ ...identity, documents: [] }) }), {} as never, { id: 'admin', org_id: 'org', roles });
beforeEach(() => { vi.clearAllMocks(); f.filters=[]; f.missing=false; f.readError=false; f.disappeared=false; f.row.documents=[]; f.gate.mockResolvedValue(null); });
it('resolves the explicit SSO identity and writes only its actual projected ID within the institution', async () => {
  expect((await post({ learnerUserId: 'sso-id' })).status).toBe(200);
  expect(f.filters).toContainEqual(['learners','user_id','sso-id']);
  expect(f.filters).toContainEqual(['learners','id','profile-id']);
  expect(f.filters).toContainEqual(['learners','college_id','org']);
});
it('keeps legacy learner-record IDs explicit rather than trying them as user IDs', async () => {
  expect((await post({ learnerId: 'profile-id' })).status).toBe(200);
  expect(f.filters.some(([,key]) => key === 'user_id')).toBe(false);
});
it('reports pending projection without an alternate ID or write', async () => {
  f.missing=true; const response=await post({ learnerUserId: 'sso-id' });
  expect(response.status).toBe(409); expect(await response.text()).toContain('LEARNER_PROJECTION_PENDING');
  expect(f.writes).not.toHaveBeenCalled();
});
it('rejects ambiguous identities and foreign records without writing', async () => {
  expect((await post({ learnerUserId: 'sso-id', learnerId: 'profile-id' })).status).toBe(400);
  expect((await post({ learnerUserId: 'foreign' })).status).toBe(409);
  expect(f.writes).not.toHaveBeenCalled();
});
it('preserves role, entitlement and storage lookup failures', async () => {
  expect((await post({ learnerUserId: 'sso-id' }, ['learner'])).status).toBe(403);
  f.gate.mockResolvedValueOnce(new Response('Denied',{status:403}));
  expect((await post({ learnerUserId: 'sso-id' })).status).toBe(403);
  f.readError=true; expect((await post({ learnerUserId: 'sso-id' })).status).toBe(503);
  expect(f.writes).not.toHaveBeenCalled();
});

it('does not report a document link when its scoped learner disappears before the update', async () => {
  f.disappeared=true; const response=await post({ learnerUserId: 'sso-id' });
  expect(response.status).toBe(409); expect(await response.text()).toContain('LEARNER_CHANGED');
});

it('does not append a document again when a successful link response was lost and the caller retries', async () => {
  f.row.documents=[{ url: 'uploads/owner/document.pdf', name: 'document.pdf' }];
  const response=await handleUpdateLearnerDocuments(new Request('https://app.test/api/user/update-learner-documents', { method: 'POST', body: JSON.stringify({ learnerUserId: 'sso-id', documents: [{ name: 'document.pdf', url: 'uploads/owner/document.pdf', size: 10, type: 'application/pdf' }] }) }), {} as never, { id: 'admin', org_id: 'org', roles: ['college_admin'] });
  expect(response.status).toBe(200);
  expect(f.writes).toHaveBeenCalledWith({ documents: [{ url: 'uploads/owner/document.pdf', name: 'document.pdf' }] });
});
