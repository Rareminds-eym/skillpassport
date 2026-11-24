import { describe, it, expect, vi } from 'vitest';
import { SyncService } from '../lib/sync-service';

function makeDbMock(existing: any | null, upsertResp: any = { error: null }, updateResp: any = { error: null }) {
  const calls: any = { upsertPayload: null, updatePayload: null };
  const db: any = {
    from: (table: string) => {
      if (table === 'subscription_cache') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: existing }),
            }),
          }),
          upsert: (payload: any, opts: any) => {
            calls.upsertPayload = payload;
            return Promise.resolve(upsertResp);
          },
          update: (payload: any) => ({
            eq: () => { calls.updatePayload = payload; return Promise.resolve(updateResp); },
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }),
        upsert: () => Promise.resolve({ error: null }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      };
    },
  };
  return { db, calls };
}

const dummyEnv = { SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: 'test-key' } as any;

describe('subscription sync regression — seat_count preservation', () => {
  it('incomplete created (no seat_count) preserves existing 5000 and assigned_seats 54', async () => {
    const existing = { seat_count: 5000, assigned_seats: 54, auth_updated_at: '2026-08-31T12:39:34Z', is_organization_subscription: true, organization_id: '284c9ed9-cd13-584d-b5bc-e198866b917b' };
    const { db, calls } = makeDbMock(existing);
    const svc: any = new SyncService(dummyEnv);
    svc.db = db;
    const res = await svc.syncSubscriptionCreated({
      id: 'd3876903-b74e-55d7-910f-90907ea3e11f',
      user_id: '783d8431-a034-5369-ae47-3aca2c4ec618',
      plan_code: 'college_enterprise',
      // seat_count omitted — faulty oauth payload
      updated_at: '2026-09-01T00:00:00Z',
    });
    expect(res.success).toBe(true);
    expect(calls.upsertPayload.seat_count).toBe(5000);
    expect(calls.upsertPayload.assigned_seats).toBe(54);
  });

  it('stale updated event (older auth_updated_at) is rejected', async () => {
    const existing = { seat_count: 5000, assigned_seats: 54, auth_updated_at: '2026-09-07T07:06:32Z' };
    const { db, calls } = makeDbMock(existing);
    const svc: any = new SyncService(dummyEnv);
    svc.db = db;
    const res = await svc.syncSubscriptionUpdated({
      id: 'd3876903-b74e-55d7-910f-90907ea3e11f',
      seat_count: 1,
      updated_at: '2026-08-31T12:39:34Z',
    });
    expect(res.success).toBe(true);
    expect(calls.updatePayload).toBeNull(); // stale rejected, no update
  });

  it('new org subscription without seat_count fails validation (not default 1)', async () => {
    const { db } = makeDbMock(null);
    const svc: any = new SyncService(dummyEnv);
    svc.db = db;
    const res = await svc.syncSubscriptionCreated({
      id: 'new-org-sub',
      user_id: 'u1',
      plan_code: 'college_enterprise',
      is_organization_subscription: true,
      // seat_count missing
    });
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('VALIDATION_ERROR');
  });

  it('individual subscription without seat_count defaults to 1', async () => {
    const { db, calls } = makeDbMock(null);
    const svc: any = new SyncService(dummyEnv);
    svc.db = db;
    const res = await svc.syncSubscriptionCreated({
      id: 'new-indiv',
      user_id: 'u2',
      plan_code: 'free',
      is_organization_subscription: false,
    });
    expect(res.success).toBe(true);
    expect(calls.upsertPayload.seat_count).toBe(1);
  });
});

describe('subscription sync revision binding', () => {
  const id = '10000000-0000-4000-8000-000000000001';
  const plan = '20000000-0000-4000-8000-000000000001';
  const revision = '30000000-0000-4000-8000-000000000001';
  const product = '40000000-0000-4000-8000-000000000001';
  const user = '50000000-0000-4000-8000-000000000001';
  const state = { id, planId: plan, revisionId: revision, productId: product, subject: { kind: 'user', id: user },
    version: 1, status: 'active', periodStartsAt: 1, periodEndsAt: null, validity: 'perpetual', trialEndsAt: null,
    renewalEnabled: false, cancelledAt: null, paymentFailedAt: null, scheduledChange: null };
  const payload = { id, user_id: user, plan_id: plan, product_id: product, plan_code: 'synthetic', status: 'active',
    plan_revision_id: revision, lifecycle_state: state, lifecycle_policy: { schemaVersion: 1 },
    lifecycle_activated_at: '2026-11-22T00:00:00Z' };

  it.each(['created', 'updated'] as const)('retains the exact complete binding for %s events', async action => {
    const { db, calls } = makeDbMock({ seat_count: 1, assigned_seats: 0 });
    const svc: any = new SyncService(dummyEnv); svc.db = db;
    const result = action === 'created' ? await svc.syncSubscriptionCreated(payload) : await svc.syncSubscriptionUpdated(payload);
    expect(result.success).toBe(true);
    expect(action === 'created' ? calls.upsertPayload : calls.updatePayload).toMatchObject({
      plan_revision_id: revision, lifecycle_state: state, lifecycle_policy: payload.lifecycle_policy,
      lifecycle_activated_at: payload.lifecycle_activated_at,
    });
  });

  it.each([
    { lifecycle_state: null }, { lifecycle_policy: null }, { lifecycle_activated_at: null },
    { lifecycle_state: { ...state, planId: product } }, { lifecycle_state: { ...state, status: 'cancelled' } },
  ])('rejects incomplete or foreign binding before persistence', async change => {
    const { db, calls } = makeDbMock(null);
    const svc: any = new SyncService(dummyEnv); svc.db = db;
    expect((await svc.syncSubscriptionCreated({ ...payload, ...change })).success).toBe(false);
    expect((await svc.syncSubscriptionUpdated({ ...payload, ...change })).success).toBe(false);
    expect(calls.upsertPayload).toBeNull(); expect(calls.updatePayload).toBeNull();
  });
});
