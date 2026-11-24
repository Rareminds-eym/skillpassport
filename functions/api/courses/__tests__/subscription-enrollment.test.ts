// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { FakeSupabase } from '../../../lib/__tests__/helpers/fake-supabase';
const access = vi.hoisted(() => vi.fn());
const actor = '10000000-0000-4000-8000-000000000001';
const learner = '20000000-0000-4000-8000-000000000001';
const course = '30000000-0000-4000-8000-000000000001';
const operation = '40000000-0000-4000-8000-000000000001';
const subscription = '50000000-0000-4000-8000-000000000001';
const product = '60000000-0000-4000-8000-000000000001';
const revision = '70000000-0000-4000-8000-000000000001';
const enrollment = '80000000-0000-4000-8000-000000000001';
let database: FakeSupabase;
vi.mock('../../../lib/auth', () => ({ withAuth: (handler: unknown) => handler, getContextUser: () => ({ id: actor }), getServiceClient: () => database }));
vi.mock('../../../shared/lib/subscription-access', () => ({ requireSubscriptionAccess: access }));
import { onRequest } from '../[[path]]';
const decision = () => ({ context: { actorId: actor, activatedAt: 10, subscriptionEndsAt: 1000,
  state: { id: subscription, productId: product, revisionId: revision, version: 1, subject: { kind: 'user', id: actor }, periodStartsAt: 100, periodEndsAt: 500 } },
  binding: { actionKey: 'course.enroll', featureKey: 'course_lte_assignments', mode: 'write', quota: { period: 'billing_period', countingEvent: 'course_lte_assignment' } },
  grant: { type: 'numeric_limit', enabled: true, limit: { kind: 'finite', value: 3 } },
});
async function run(body: unknown) {
  return onRequest({ env: {}, request: new Request('https://fixture.invalid/api/courses/enroll', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }) } as never);
}
const body = () => ({ learnerEmail: 'learner@fixture.invalid', courseId: course, operationId: operation });
beforeEach(() => {
  vi.clearAllMocks(); database = new FakeSupabase();
  database.seed('learners', [{ id: learner, user_id: actor, email: 'learner@fixture.invalid' }]);
  access.mockResolvedValue(decision());
});
it('joins exact owner authorization to the actual enrollment transaction without client-side quota or resource writes', async () => {
  const rpc = vi.spyOn(database, 'rpc').mockResolvedValue({ data: { operationId: operation, created: true,
    enrollment: { id: enrollment, learner_id: learner, course_id: course } }, error: null } as never);
  expect((await run(body())).status).toBe(201);
  expect(access).toHaveBeenCalledWith(expect.objectContaining({ actorId: actor, subject: { kind: 'user', id: actor }, actionKey: 'course.enroll', mode: 'write' }));
  expect(rpc).toHaveBeenCalledExactlyOnceWith('enroll_subscription_course', {
    p_actor: actor, p_learner: learner, p_course: course, p_operation: operation,
    p_authorization: { schemaVersion: 1, actorId: actor, subject: { kind: 'user', id: actor }, subscriptionId: subscription,
      productId: product, revisionId: revision, version: 1, actionKey: 'course.enroll', featureKey: 'course_lte_assignments', mode: 'write', validUntil: 500,
      quota: { period: 'billing_period', countingEvent: 'course_lte_assignment', periodStartsAt: 100, periodEndsAt: 500, limit: 3 } },
  });
  expect(database.writes()).toHaveLength(0);
});
it('does not invoke the owner for a foreign learner selected by email', async () => {
  database.tables.learners[0].user_id = revision;
  const rpc = vi.spyOn(database, 'rpc');
  expect((await run(body())).status).toBe(403); expect(access).not.toHaveBeenCalled(); expect(rpc).not.toHaveBeenCalled();
});
it('does not invoke the owner after read-only or suspended access denial', async () => {
  const denial = Response.json({ error: 'Subscription access denied' }, { status: 403 }); access.mockResolvedValue(denial);
  const rpc = vi.spyOn(database, 'rpc');
  expect(await run(body())).toBe(denial); expect(rpc).not.toHaveBeenCalled(); expect(database.writes()).toHaveLength(0);
});
it.each([['54000', 402], ['42501', 403], ['22023', 409], ['P0002', 404]])('propagates owner rejection %s', async (code, status) => {
  vi.spyOn(database, 'rpc').mockResolvedValue({ data: null, error: { code, message: 'Owner rejected' } } as never);
  expect((await run(body())).status).toBe(status); expect(database.writes()).toHaveLength(0);
});
it('rejects a receipt with a different course rather than reporting enrollment success', async () => {
  vi.spyOn(database, 'rpc').mockResolvedValue({ data: { operationId: operation, created: true,
    enrollment: { id: enrollment, learner_id: learner, course_id: product } }, error: null } as never);
  expect((await run(body())).status).toBe(503);
});
it('retains successful replay status without reimplementing the owner transaction', async () => {
  vi.spyOn(database, 'rpc').mockResolvedValue({ data: { operationId: operation, created: false,
    enrollment: { id: enrollment, learner_id: learner, course_id: course } }, error: null } as never);
  expect((await run(body())).status).toBe(200); expect(database.writes()).toHaveLength(0);
});
it('rejects caller-supplied price or capacity policy', async () => {
  const rpc = vi.spyOn(database, 'rpc');
  expect((await run({ ...body(), limit: 1000 })).status).toBe(400); expect(rpc).not.toHaveBeenCalled();
});
