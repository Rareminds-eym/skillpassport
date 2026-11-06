import { beforeEach, expect, it, vi } from 'vitest';
import { FakeSupabase } from '../../../lib/__tests__/helpers/fake-supabase';
const f = vi.hoisted(() => ({ memberships: vi.fn(), organization: vi.fn() }));
let db: FakeSupabase;
vi.mock('../../../lib/supabase', () => ({ getServiceClient: () => db }));
vi.mock('../../../lib/auth', () => ({ getContextUser: (context: any) => context.data.user }));
import { handleOrganizationGet } from '../handler';
const org = { id: 'college-1', admin_id: 'original-owner', organization_type: 'college', name: 'Existing college' };
const actor = { id: 'educator-1', org_id: org.id, roles: ['college_admin', 'college_educator'] };
const request = (adminId = actor.id) => handleOrganizationGet({
  request: new Request(`https://app.invalid/api/organization?action=getOrganizationByAdminId&orgType=college&adminId=${adminId}`),
  env: { SSO_SERVICE: { getUserMemberships: f.memberships, getOrganizationById: f.organization } }, data: { user: actor },
} as any);
beforeEach(() => {
  db = new FakeSupabase().seed('organizations', [org]);
  const from = db.from.bind(db);
  vi.spyOn(db, 'from').mockImplementation((table: string) => {
    const query = from(table);
    (query as any).contains = (column: string, value: Record<string, unknown>) => {
      const match = db.rows(table).find(row => Object.entries(value).every(([key, expected]) => row[column]?.[key] === expected));
      return query.eq('id', match?.id ?? '__no_metadata_match__');
    };
    return query;
  });
  f.memberships.mockReset();
  f.organization.mockReset();
  f.organization.mockResolvedValue({ id: org.id, metadata: { organization_type: 'college' } });
  f.memberships.mockResolvedValue({ memberships: [{ org_id: org.id, status: 'active', roles: actor.roles }] });
});
it('resolves an additional admin through active SSO membership without replacing the owner', async () => {
  const response = await request();
  expect(response.status).toBe(200);
  expect((await response.json() as any).data).toMatchObject(org);
  expect(f.memberships).toHaveBeenCalledWith(actor.id);
  expect(db.writes()).toEqual([]);
});
it('rejects another user ID before reading organizations', async () => {
  expect((await request('someone-else')).status).toBe(403);
  expect(db.accesses).toEqual([]);
});
it.each([
  { org_id: org.id, status: 'inactive', roles: actor.roles },
  { org_id: 'other-college', status: 'active', roles: actor.roles },
  { org_id: org.id, status: 'active', roles: ['college_educator'] },
])('does not grant college access for invalid membership %j', async membership => {
  f.memberships.mockResolvedValue({ memberships: [membership] });
  const response = await request();
  expect((await response.json() as any).data).toBeNull();
});
it('returns a retryable failure during an SSO outage instead of triggering college setup', async () => {
  f.memberships.mockRejectedValue(new Error('offline'));
  expect((await request()).status).toBe(503);
});
it('does not return null when a verified membership has a missing organization shadow', async () => {
  db.tables.organizations = [];
  expect((await request()).status).toBe(503);
});
it('lets a new signup owner complete institution setup', async () => {
  db.tables.organizations = [];
  f.memberships.mockResolvedValue({ memberships: [{ org_id: org.id, status: 'active', roles: ['owner', 'college_admin'] }] });
  f.organization.mockResolvedValue({ id: org.id, metadata: {} });
  const response = await request();
  expect(response.status).toBe(200);
  expect((await response.json() as any).data).toBeNull();
  expect(f.organization).toHaveBeenCalledWith(org.id);
  expect(db.writes()).toEqual([]);
});
it('does not send the owner of an already configured college back to setup', async () => {
  db.tables.organizations = [];
  f.memberships.mockResolvedValue({ memberships: [{ org_id: org.id, status: 'active', roles: ['owner', 'college_admin'] }] });
  expect((await request()).status).toBe(503);
});
it('fails closed when the canonical signup institution cannot be verified', async () => {
  db.tables.organizations = [];
  f.memberships.mockResolvedValue({ memberships: [{ org_id: org.id, status: 'active', roles: ['owner', 'college_admin'] }] });
  f.organization.mockRejectedValue(new Error('offline'));
  expect((await request()).status).toBe(503);
});
it('rejects a mismatched organization type', async () => {
  db.tables.organizations = [{ ...org, organization_type: 'school' }];
  expect((await request()).status).toBe(503);
});
it('keeps the original owner lookup working', async () => {
  db = new FakeSupabase().seed('organizations', [{ ...org, admin_id: actor.id }]);
  expect((await request()).status).toBe(200);
  expect(f.memberships).not.toHaveBeenCalled();
});
