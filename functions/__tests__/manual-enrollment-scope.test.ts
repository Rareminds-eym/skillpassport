// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const f = vi.hoisted(() => ({ create: vi.fn(), gate: vi.fn(), type: 'college' }));
vi.mock('../lib/supabase', () => ({ createSupabaseAdminClient: () => ({ from: () => {
  const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: { id: 'org', organization_type: f.type }, error: null }) };
  return q;
} }) }));
vi.mock('../lib/admin-feature-request', () => ({ requireAdminRequestFeature: f.gate }));
import { handleCreateLearner } from '../api/user/handlers/authenticated';
const actor = { id: 'verified-admin', org_id: 'org', roles: ['college_admin'] };
const body = { userEmail: 'spoofed@example.test', collegeId: 'org', learner: { name: 'Learner', email: 'learner@example.test', contactNumber: '1234567890', rollNumber: '12', district: 'District' } };
const post = (value: unknown = body, caller = actor) => handleCreateLearner(new Request('https://app.test/api/user/create-learner', { method: 'POST', body: JSON.stringify(value) }), { SSO_SERVICE: { createLearnerUser: f.create } } as never, caller);
beforeEach(() => { vi.clearAllMocks(); f.type = 'college'; f.gate.mockResolvedValue(null); f.create.mockResolvedValue({ success: true, user_id: 'learner' }); });
it('uses verified actor and tenant, ignoring the client-supplied admin email', async () => {
  expect((await post()).status).toBe(200);
  expect(f.create).toHaveBeenCalledWith(expect.objectContaining({ organization_id: 'org', metadata: expect.objectContaining({ addedBy: 'verified-admin', college_id: 'org', roll_number: '12', district_name: 'District' }) }));
});
it('rejects another tenant before provisioning', async () => {
  expect((await post({ ...body, collegeId: 'other' })).status).toBe(403);
  expect(f.create).not.toHaveBeenCalled();
});
it('preserves the admission entitlement denial', async () => {
  f.gate.mockResolvedValue(new Response('Denied', { status: 403 }));
  expect((await post()).status).toBe(403);
  expect(f.create).not.toHaveBeenCalled();
});
it('rejects an authenticated learner claiming to be an admin through body email', async () => {
  expect((await post(body, { ...actor, roles: ['learner'] })).status).toBe(403);
  expect(f.create).not.toHaveBeenCalled();
});

it('preserves enrollment by an authorized college educator in the verified college', async () => {
  expect((await post(body, { ...actor, roles: ['college_educator'] })).status).toBe(200);
  expect(f.create).toHaveBeenCalledWith(expect.objectContaining({ organization_id: 'org' }));
});
it('preserves the existing school educator flow without trusting a body email', async () => {
  f.type = 'school';
  expect((await post({ ...body, collegeId: undefined, schoolId: 'org' }, { ...actor, roles: ['educator'] })).status).toBe(200);
  expect(f.create).toHaveBeenCalledWith(expect.objectContaining({ organization_id: 'org', metadata: expect.objectContaining({ school_id: 'org', college_id: null }) }));
});

it('rejects an educator targeting another institution', async () => {
  expect((await post({ ...body, collegeId: 'other' }, { ...actor, roles: ['college_educator'] })).status).toBe(403);
  expect(f.create).not.toHaveBeenCalled();
});
