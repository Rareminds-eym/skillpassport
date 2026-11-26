// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { FakeSupabase } from '../../../lib/__tests__/helpers/fake-supabase';
let fake: FakeSupabase;
vi.mock('../../../lib/supabase', () => ({ getServiceClient: () => fake }));
vi.mock('../../../lib/auth', () => ({ getContextUser: (c: { data: { user: { sub: string } } }) => ({ ...c.data.user, id: c.data.user.sub }) }));
import { handleOrganizationPost } from '../handler';
const updateOrganization = vi.fn(), createOrganization = vi.fn(), updateOrganizationDetails = vi.fn();
const profile = { name: '  Institution entered by admin  ', city: 'Chennai', state: 'Tamil Nadu', address: 'Main Road', country: 'India', phone: '9876543210', email: 'office@example.invalid', website: 'https://example.invalid' };
function request(type: string, body: Record<string, unknown> = {}, orgId: string | undefined = 'org', roles = [`${type}_admin`]) {
  return { request: new Request('http://localhost/api/organization', { method: 'POST', body: JSON.stringify({ action: 'createOrganization', organization_type: type, ...profile, ...body }) }),
    env: { SSO_SERVICE: { updateOrganization, createOrganization, updateOrganizationDetails } },
    data: { user: { sub: 'admin', org_id: orgId, roles } } } as never;
}
beforeEach(() => {
  fake = new FakeSupabase();
  fake.seed('organizations', [{ id: 'org', name: 'Signup name', metadata: { unrelated: 'keep' } }]);
  updateOrganization.mockReset().mockResolvedValue({ success: true });
  createOrganization.mockReset().mockResolvedValue({ success: true, org_id: 'new-org' });
  updateOrganizationDetails.mockReset();
});
it.each(['school', 'college'])('saves %s registration to dedicated columns and updates the canonical SSO name', async type => {
  const response = await handleOrganizationPost(request(type, { id: 'forged', admin_id: 'another-user', metadata: { name: 'forged' }, approval_status: 'approved' }));
  expect(response.status).toBe(200);
  expect(updateOrganization).toHaveBeenCalledExactlyOnceWith({ id: 'org', name: profile.name.trim() });
  expect(updateOrganizationDetails).not.toHaveBeenCalled(); expect(createOrganization).not.toHaveBeenCalled();
  expect(fake.rows('organizations')).toHaveLength(1);
  expect(fake.rows('organizations')[0]).toMatchObject({ ...profile, name: profile.name.trim(), id: 'org', admin_id: 'admin', organization_type: type, metadata: { unrelated: 'keep' } });
  expect(fake.writes()[0].values).not.toHaveProperty('metadata');
  expect(fake.writes()[0].values).not.toHaveProperty('approval_status');
  expect((await response.json() as { data: object }).data).toMatchObject({ id: 'org', name: profile.name.trim() });
});
it('does not report registration success when saving profile columns fails', async () => {
  fake.injected.push({ table: 'organizations', op: 'upsert', error: { message: 'Unavailable' } });
  const response = await handleOrganizationPost(request('college'));
  expect(response.status).toBe(503);
  expect(fake.rows('organizations')[0].city).toBeUndefined();
  fake.injected = [];
  expect((await handleOrganizationPost(request('college'))).status).toBe(200);
  expect(fake.rows('organizations')).toHaveLength(1);
  expect(createOrganization).not.toHaveBeenCalled();
});
it('saves a new institution profile in columns without sending it as SSO metadata', async () => {
  expect((await handleOrganizationPost(request('school', {}, ''))).status).toBe(200);
  expect(createOrganization).toHaveBeenCalledWith(expect.objectContaining({ name: profile.name.trim(), created_by: 'admin', metadata: { organization_type: 'school' } }));
  expect(fake.rows('organizations').find(row => row.id === 'new-org')).toMatchObject({ ...profile, name: profile.name.trim(), admin_id: 'admin', organization_type: 'school' });
});
it('keeps the local profile unchanged when the SSO name update fails', async () => {
  updateOrganization.mockResolvedValue({ success: false, error: 'Unavailable' });
  expect((await handleOrganizationPost(request('school'))).status).toBe(500);
  expect(fake.writes()).toHaveLength(0);
});
it('rejects a mismatched admin role before identity or profile writes', async () => {
  expect((await handleOrganizationPost(request('college', {}, 'org', ['school_admin']))).status).toBe(403);
  expect(updateOrganization).not.toHaveBeenCalled(); expect(fake.writes()).toHaveLength(0);
});
it.each([{ name: 123 }, { city: '' }, { state: null }])('rejects incomplete registration: %j', async body => {
  expect((await handleOrganizationPost(request('college', body))).status).toBe(400);
  expect(updateOrganization).not.toHaveBeenCalled(); expect(fake.writes()).toHaveLength(0);
});
