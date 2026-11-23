// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { FakeSupabase } from '../../../lib/__tests__/helpers/fake-supabase';
import fs from 'node:fs';
import * as ts from 'typescript';
let fake: FakeSupabase;
vi.mock('../../../lib/supabase', () => ({ getServiceClient: () => fake }));
vi.mock('../../../lib/auth', () => ({ getContextUser: (c: { data: { user: { sub: string; email?: string } } }) => ({ ...c.data.user, id: c.data.user.sub }), withAuth: (h: unknown) => h }));
import { handleOrganizationGet, handleOrganizationPost } from '../handler';
import { onRequestPost } from '../../subscription/actions';
import { handleLicensePoolQueries } from '../../payments/handlers/license-pool-queries';
function context(body: object, sub = 'outsider', email?: string) {
  return { request: new Request('http://localhost/api/organization', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), env: {}, data: { user: { sub, email } } } as never;
}
function get(url: string, sub = 'outsider') { return { request: new Request('http://localhost'+url), env: {}, data: { user: { sub } } } as never; }
function admin() { fake.seed('organization_members', [{ user_id: 'admin', organization_id: 'org', role: 'owner', status: 'active' }]); }
function pool() { fake.seed('license_pools', [{ id: 'pool', organization_id: 'org', organization_subscription_id: 'sub', allocated_seats: 10, assigned_seats: 5 }]); }
beforeEach(() => {
  fake = new FakeSupabase();
  const from = fake.from.bind(fake);
  fake.from = (table: string) => { const b = from(table); Object.assign(b, { order: () => b, in: (col: string, ids: unknown[]) => { if (ids.length === 1) b.eq(col, ids[0]); return b; } }); return b; };
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
it.each(['create-license-pool', 'list-license-pools', 'list-license-assignments', 'get-license-assignment-stats'])('%s denies an outsider before tenant reads/writes', async action => {
  const r = await onRequestPost(context({ action, organizationId: 'org' }));
  expect(r.status).toBe(403); expect(fake.writes()).toHaveLength(0); expect(fake.accessesTo('license_assignments')).toHaveLength(0);
});
it.each(['update-license-pool', 'delete-license-pool', 'list-pool-assignments', 'list-license-assignments-by-pool'])('%s resolves pool tenant and denies outsider', async action => {
  pool(); expect((await onRequestPost(context({ action, poolId: 'pool' }))).status).toBe(403); expect(fake.writes()).toHaveLength(0);
});
it('current pool edit maps form fields and rejects arbitrary DB fields', async () => {
  pool(); admin();
  expect((await onRequestPost(context({ action: 'update-license-pool', poolId: 'pool', assigned_seats: 0 }, 'admin'))).status).toBe(400);
  expect(fake.writes()).toHaveLength(0);
  const r = await onRequestPost(context({ action: 'update-license-pool', poolId: 'pool', poolName: 'New', allocatedSeats: 12, autoAssignNewMembers: true, isActive: false }, 'admin'));
  expect(r.status).toBe(200); expect(fake.rows('license_pools')[0]).toMatchObject({ pool_name: 'New', allocated_seats: 12, auto_assign_new_members: true, is_active: false, assigned_seats: 5 });
});
it('create pool uses verified actor and correct tenant subscription', async () => {
  admin(); fake.seed('subscription_cache', [{ id: 'sub', organization_id: 'org', seat_count: 30 }]);
  expect((await onRequestPost(context({ action: 'create-license-pool', organizationId: 'org', organizationSubscriptionId: 'sub', organizationType: 'college', memberType: 'learner', poolName: 'Pool', allocatedSeats: 10, createdBy: 'spoofed' }, 'admin'))).status).toBe(200);
  expect(fake.rows('license_pools')[0].created_by).toBe('admin');
});
it.each(['updatePoolAllocation', 'configureAutoAssignment'])('%s denies a non-admin', async action => {
  pool(); expect((await handleOrganizationPost(context({ action, poolId: 'pool', newAllocation: 6, enabled: true }))).status).toBe(403); expect(fake.writes()).toHaveLength(0);
});
it('legacy createPool uses canonical flag and validates subscription tenant', async () => {
  admin(); fake.seed('subscription_cache', [{ id: 'sub', organization_id: 'org', is_organization_subscription: true, seat_count: 30 }]);
  const r = await handleOrganizationPost(context({ action: 'createPool', organizationSubscriptionId: 'sub', organizationId: 'org', organizationType: 'college', memberType: 'learner', poolName: 'Pool', allocatedSeats: 10 }, 'admin'));
  expect(r.status).toBe(200); expect(fake.rows('license_pools')).toHaveLength(1);
  expect(fake.accessesTo('subscription_cache')[0].filters).toContainEqual(['is_organization_subscription', true]);
});
it('by-ID subscription reads deny foreign tenant before seat count query', async () => {
  fake.seed('subscription_cache', [{ id: 'sub', organization_id: 'foreign' }]);
  const rpc = vi.spyOn(fake, 'rpc');
  expect((await handleOrganizationGet(get('/api/organization?action=getSubscriptions&subId=sub'))).status).toBe(403); expect(rpc).not.toHaveBeenCalled();
});
it('successful count RPC replaces stale five with zero, and count errors do not return stale success', async () => {
  pool(); admin(); const rpc = vi.spyOn(fake, 'rpc').mockResolvedValue({ data: { pools: {}, subscriptions: {} }, error: null } as never);
  const r = await handleOrganizationGet(get('/api/organization?action=getLicensePools&orgId=org', 'admin'));
  expect((await r.json() as { data: Array<Record<string, unknown>> }).data[0]).toMatchObject({ assigned_seats: 0, available_seats: 10 });
  rpc.mockResolvedValue({ data: null, error: { message: 'count unavailable' } } as never);
  expect((await handleOrganizationGet(get('/api/organization?action=getLicensePools&orgId=org', 'admin'))).status).toBe(500);
});
it.each(['assignLicense', 'unassignLicense', 'transferLicense'])('%s uses one transactional RPC with the session actor', async action => {
  const rpc = vi.spyOn(fake, 'rpc').mockResolvedValue({ data: { success: true }, error: null } as never);
  const r = await handleOrganizationPost(context({ action, poolId: 'pool', userId: 'target', assignmentId: 'assignment', fromUserId: 'source', toUserId: 'target', organizationSubscriptionId: 'sub', assignedBy: 'spoofed' }, 'admin'));
  expect(r.status).toBe(200); expect(rpc).toHaveBeenCalledTimes(1); expect(rpc.mock.calls[0]).toEqual(['manage_organization_license', expect.objectContaining({ p_actor: 'admin' })]); expect(fake.writes()).toHaveLength(0);
});
it.each([['42501',403], ['23514',409], ['23505',409], ['P0002',404]])('transaction rejection %s returns %s without fake success', async (code,status) => {
  vi.spyOn(fake, 'rpc').mockResolvedValue({ data: null, error: { code, message: 'Rejected' } } as never);
  expect((await handleOrganizationPost(context({ action: 'transferLicense', fromUserId: 'a', toUserId: 'b', organizationSubscriptionId: 'sub' }, 'admin'))).status).toBe(status);
});
it('member removal denies outsider and invokes the atomic operation for verified admin', async () => {
  const body = { action: 'removeMember', memberId: 'learner', memberType: 'learner', organizationType: 'college', organizationId: 'org' };
  const rpc = vi.spyOn(fake, 'rpc').mockResolvedValue({ data: { success: true }, error: null } as never);
  expect((await handleOrganizationPost(context(body))).status).toBe(403); expect(rpc).not.toHaveBeenCalled();
  admin(); expect((await handleOrganizationPost(context(body,'admin'))).status).toBe(200); expect(rpc.mock.calls[0][0]).toBe('remove_organization_seat_member'); expect(fake.writes()).toHaveLength(0);
});
it('pool-linked invitation acceptance delegates the complete transaction', async () => {
  fake.seed('organization_invitations', [{ id: 'inv', invitation_token: 'token', status: 'pending', expires_at: '2099-01-01', invitee_role: 'learner', invitee_email: 'synthetic@example.invalid', license_pool_id: 'pool' }]);
  const rpc = vi.spyOn(fake,'rpc').mockResolvedValue({ data: { status: 'accepted' }, error: null } as never);
  expect((await handleOrganizationPost(context({ action: 'acceptInvitation', token: 'token' }, 'invitee', 'synthetic@example.invalid'))).status).toBe(200);
  expect(rpc.mock.calls[0]).toEqual(['accept_organization_learner_invitation', { p_invitation: 'inv', p_actor: 'invitee', p_email: 'synthetic@example.invalid' }]); expect(fake.writes()).toHaveLength(0);
});
it('alternate query uses organization membership, and authorizes admin without requiring a license', async () => {
  pool(); expect((await handleLicensePoolQueries(get('/api/payments/license-pool-queries?action=getLicensePools&orgId=org'))).status).toBe(403);
  admin(); const r = await handleLicensePoolQueries(get('/api/payments/license-pool-queries?action=getLicensePools&orgId=org','admin'));
  expect(r.status).toBe(200); expect((await r.json() as { data: Array<Record<string, unknown>> }).data).toHaveLength(1);
});
it('pool creation opens with ten truly unallocated seats despite ten assignments', () => {
  const file = new URL('../../../../src/pages/subscription/OrganizationSubscriptionPage.tsx', import.meta.url);
  const source = ts.createSourceFile('page.tsx',fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX); let arrow = '';
  function visit(n: ts.Node) { if (ts.isVariableDeclaration(n) && n.name.getText(source)==='handleCreatePool' && n.initializer && ts.isCallExpression(n.initializer)) arrow=n.initializer.arguments[0].getText(source); ts.forEachChild(n,visit); } visit(source);
  expect(arrow).not.toBe(''); const open=vi.fn(); const toast={error:vi.fn()};
  new Function('subscriptions','licensePools','toast','setIsCreatePoolModalOpen','return ('+arrow+')')([{status:'active',totalSeats:30,assignedSeats:10}],[{allocatedSeats:20,assignedSeats:10}],toast,open)();
  expect(open).toHaveBeenCalledWith(true); expect(toast.error).not.toHaveBeenCalled();
});
it.each([['add-seats', undefined], ['new', 'existing-contract']])('checkout prevents %s intent from becoming an unrelated new subscription', async (mode, existingSubscriptionId) => {
  const file=new URL('../../../../src/pages/subscription/OrganizationPaymentPage.tsx',import.meta.url);
  const source=ts.createSourceFile('payment.tsx',fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let arrow='';
  function visit(n:ts.Node){if(ts.isVariableDeclaration(n)&&n.name.getText(source)==='handleSubmit'&&n.initializer&&ts.isCallExpression(n.initializer))arrow=n.initializer.arguments[0].getText(source);ts.forEachChild(n,visit);}visit(source);
  expect(arrow).not.toBe('');const js=ts.transpileModule('const callback = '+arrow,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const error=vi.fn();const event={preventDefault:vi.fn()};
  // Other checkout dependencies deliberately remain unbound: this branch must
  // return before billing preparation, provider loading, or charging.
  const callback=new Function('loading','plan','organizationConfig','mode','existingSubscriptionId','setError',js+';return callback')(false,{id:'plan'},{},mode,existingSubscriptionId,error);
  await callback(event);expect(event.preventDefault).toHaveBeenCalled();expect(error).toHaveBeenCalledWith(expect.stringContaining('agreed contract update'));
});
it('authorized assignment listing filters by organization-owned pools',async()=>{
  admin();pool();fake.seed('license_assignments',[{id:'own',license_pool_id:'pool',status:'active'},{id:'foreign',license_pool_id:'foreign-pool',status:'active'}]);
  const r=await onRequestPost(context({action:'list-license-assignments',organizationId:'org'},'admin'));
  expect(r.status).toBe(200);expect((await r.json() as {data:{id:string}[]}).data.map(row=>row.id)).toEqual(['own']);
});
import {handleOrganizationQueries} from '../../payments/handlers/organization-queries';
it('alternate organization subscription query checks real membership rather than license columns',async()=>{
 fake.seed('subscription_cache',[{id:'sub',organization_id:'org',status:'active'}]);
 expect((await handleOrganizationQueries(get('/api/payments/organization-queries?action=getOrganizationSubscription&orgId=org'))).status).toBe(403);
 admin();expect((await handleOrganizationQueries(get('/api/payments/organization-queries?action=getOrganizationSubscription&orgId=org','admin'))).status).toBe(200);
});
it('entitlement usage summary denies foreign subscription access before reading counts',async()=>{
 fake.seed('subscription_cache',[{id:'sub',organization_id:'foreign'}]);
 expect((await handleOrganizationGet(get('/api/organization?action=getOrganizationEntitlementStats&subscriptionId=sub'))).status).toBe(403);
 expect(fake.accessesTo('user_entitlements')).toHaveLength(0);
});
