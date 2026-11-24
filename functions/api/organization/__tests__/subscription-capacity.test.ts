// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { FakeSupabase } from '../../../lib/__tests__/helpers/fake-supabase';
const access = vi.hoisted(() => vi.fn());
let database: FakeSupabase;
vi.mock('../../../lib/supabase', () => ({ getServiceClient: () => database }));
vi.mock('../../../lib/auth', () => ({ getContextUser: () => ({ id: 'actor' }) }));
vi.mock('../../../shared/lib/subscription-access', () => ({ requireSubscriptionAccess: access }));
import { handleOrganizationPost } from '../handler';
const commands = [
  { action: 'assignLicense', poolId: 'pool', userId: 'target' },
  { action: 'unassignLicense', assignmentId: 'assignment' },
  { action: 'transferLicense', fromUserId: 'source', toUserId: 'target', organizationSubscriptionId: 'subscription' },
];
const context = (body: object) => ({ env: {}, request: new Request('https://example.invalid/api/organization', {
  method: 'POST', body: JSON.stringify({ ...body, organizationId: 'spoofed' }),
}) }) as never;
beforeEach(() => {
  vi.clearAllMocks(); database = new FakeSupabase();
  database.seed('organization_members', [{ user_id: 'actor', organization_id: 'organization', role: 'owner', status: 'active' }]);
  database.seed('license_pools', [{ id: 'pool', organization_id: 'organization', organization_subscription_id: 'subscription', member_type: 'educator' }]);
  database.seed('license_assignments', [{ id: 'assignment', user_id: 'source', organization_subscription_id: 'subscription', member_type: 'educator', status: 'active' }]);
  database.seed('subscription_cache', [{ id: 'subscription', organization_id: 'organization', is_organization_subscription: true, seat_count: 2 }]);
  access.mockResolvedValue({ current: {} });
});
it.each(commands)('$action checks the persisted organization before its atomic owner', async command => {
  const rpc = vi.spyOn(database, 'rpc').mockResolvedValue({ data: { success: true }, error: null } as never);
  expect((await handleOrganizationPost(context(command))).status).toBe(200);
  expect(access).toHaveBeenCalledWith(expect.objectContaining({ actorId: 'actor', mode: 'write', subject: { kind: 'organization', id: 'organization' } }));
  expect(rpc).toHaveBeenCalledExactlyOnceWith('manage_organization_license', expect.objectContaining({ p_actor: 'actor' }));
  expect(database.writes()).toHaveLength(0);
});
it.each(commands)('$action propagates lifecycle denial without invoking the seat transaction', async command => {
  const denial = Response.json({ error: 'Subscription access denied' }, { status: 403 });
  access.mockResolvedValue(denial); const rpc = vi.spyOn(database, 'rpc');
  expect(await handleOrganizationPost(context(command))).toBe(denial);
  expect(rpc).not.toHaveBeenCalled(); expect(database.writes()).toHaveLength(0);
});
it.each(commands)('$action preserves admin checks before requesting subscription access', async command => {
  database.tables.organization_members = []; const rpc = vi.spyOn(database, 'rpc');
  expect((await handleOrganizationPost(context(command))).status).toBe(403);
  expect(access).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled();
});
it('missing pool never uses the request organization or calls the owner', async () => {
  database.tables.license_pools = []; const rpc = vi.spyOn(database, 'rpc');
  expect((await handleOrganizationPost(context(commands[0]))).status).toBe(404);
  expect(access).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled();
});
it('owner failure propagates after successful lifecycle authorization', async () => {
  vi.spyOn(database, 'rpc').mockResolvedValue({ data: null, error: { code: '23514', message: 'capacity rejected' } } as never);
  expect((await handleOrganizationPost(context(commands[0]))).status).toBe(409);
  expect(database.writes()).toHaveLength(0);
});

const alternateWrites = [
  { action: 'createPool', organizationSubscriptionId: 'subscription', organizationId: 'organization', allocatedSeats: 1 },
  { action: 'updatePoolAllocation', poolId: 'pool', newAllocation: 1 },
  { action: 'configureAutoAssignment', poolId: 'pool', enabled: true },
  { action: 'inviteMember', organizationId: 'organization', memberType: 'learner', email: 'synthetic@example.invalid' },
  { action: 'grantEntitlement', organizationSubscriptionId: 'subscription', userId: 'target', featureKey: 'synthetic' },
  { action: 'revokeEntitlements', organizationSubscriptionId: 'subscription', userId: 'target' },
  { action: 'bulkGrantEntitlements', organizationSubscriptionId: 'subscription', userIds: ['target'], featureKeys: ['synthetic'] },
  { action: 'bulkRevokeEntitlements', organizationSubscriptionId: 'subscription', userIds: ['target'] },
  { action: 'removeMember', organizationId: 'organization', memberId: 'target', memberType: 'learner', organizationType: 'school' },
];
it.each(alternateWrites)('$action cannot mutate a read-only organization through an alternate writer', async command => {
  const denial = Response.json({ error: 'Subscription access denied' }, { status: 403 });
  access.mockResolvedValue(denial);
  const rpc = vi.spyOn(database, 'rpc');
  const input = { env: {}, request: new Request('https://example.invalid/api/organization', {
    method: 'POST', body: JSON.stringify(command),
  }) } as never;
  expect(await handleOrganizationPost(input)).toBe(denial);
  expect(access).toHaveBeenCalledWith(expect.objectContaining({ mode: 'write', subject: { kind: 'organization', id: 'organization' } }));
  expect(database.writes()).toHaveLength(0);
  expect(rpc).not.toHaveBeenCalled();
});
it.each(['grantEntitlement', 'bulkGrantEntitlements', 'revokeEntitlements', 'bulkRevokeEntitlements'])('%s denies a cross-tenant retained subscription before authority lookup', async action => {
  database.tables.subscription_cache = [{ id: 'subscription', organization_id: 'foreign' }];
  expect((await handleOrganizationPost(context({ action, organizationSubscriptionId: 'subscription' }))).status).toBe(403);
  expect(access).not.toHaveBeenCalled();
  expect(database.writes()).toHaveLength(0);
});

const includedCapacity = () => ({ context: { actorId: 'actor', activatedAt: 10, subscriptionEndsAt: 1000,
  state: { id: 'subscription', productId: 'product', revisionId: 'revision', version: 2,
    subject: { kind: 'organization', id: 'organization' }, periodStartsAt: 100, periodEndsAt: 500 } },
  binding: { actionKey: 'organization.learner.assign', featureKey: 'included_learner_capacity', mode: 'write',
    quota: { period: 'concurrent', countingEvent: 'learner_assignment' } },
  grant: { type: 'numeric_limit', enabled: true, limit: { kind: 'finite', value: 25 } },
});
it.each(['assignLicense', 'transferLicense'])('%s sends included learner capacity to the owning transaction', async action => {
  database.tables.license_pools[0].member_type = 'learner';
  database.tables.license_assignments[0].member_type = 'learner';
  access.mockResolvedValue(includedCapacity());
  const rpc = vi.spyOn(database, 'rpc').mockResolvedValue({ data: { success: true }, error: null } as never);
  const command = action === 'assignLicense' ? commands[0] : commands[2];
  expect((await handleOrganizationPost(context(command))).status).toBe(200);
  expect(access).toHaveBeenCalledWith(expect.objectContaining({ actionKey: 'organization.learner.assign' }));
  expect(rpc).toHaveBeenCalledExactlyOnceWith('manage_subscription_learner_license', expect.objectContaining({
    p_actor: 'actor', p_authorization: expect.objectContaining({ subscriptionId: 'subscription', revisionId: 'revision', version: 2,
      actionKey: 'organization.learner.assign', featureKey: 'included_learner_capacity',
      quota: { period: 'concurrent', countingEvent: 'learner_assignment', periodStartsAt: 100, periodEndsAt: 500, limit: 25 } }),
  }));
  expect(database.writes()).toHaveLength(0);
});
it('does not substitute another initialized contract for the persisted learner pool subscription', async () => {
  database.tables.license_pools[0].member_type = 'learner';
  const decision = includedCapacity(); decision.context.state.id = 'foreign-subscription'; access.mockResolvedValue(decision);
  const rpc = vi.spyOn(database, 'rpc');
  expect((await handleOrganizationPost(context(commands[0]))).status).toBe(503);
  expect(rpc).not.toHaveBeenCalled(); expect(database.writes()).toHaveLength(0);
});
it('rejects an untyped persisted pool rather than treating it as an educator license', async () => {
  delete database.tables.license_pools[0].member_type;
  const rpc = vi.spyOn(database, 'rpc');
  expect((await handleOrganizationPost(context(commands[0]))).status).toBe(503);
  expect(rpc).not.toHaveBeenCalled();
});
it('a caller cannot bypass included learner capacity by labeling a persisted learner pool as staff', async () => {
  database.tables.license_pools[0].member_type = 'learner';
  access.mockResolvedValue(includedCapacity());
  const rpc = vi.spyOn(database, 'rpc').mockResolvedValue({ data: { success: true }, error: null } as never);
  expect((await handleOrganizationPost(context({ ...commands[0], memberType: 'educator' }))).status).toBe(200);
  expect(rpc).toHaveBeenCalledExactlyOnceWith('manage_subscription_learner_license', expect.objectContaining({
    p_authorization: expect.objectContaining({ featureKey: 'included_learner_capacity' }),
  }));
});
