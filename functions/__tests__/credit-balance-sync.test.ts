import { describe, it, expect } from 'vitest';
import { SyncService } from '../lib/sync-service';

const PRODUCT = '912d5049-e195-46e9-a319-49e3502bf7e7';
const OTHER_PRODUCT = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

function makeDbMock(users: any, cache: any) {
  const calls: any = { upsertPayload: null };
  const db: any = {
    from: (table: string) => {
      if (table === 'users') {
        return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: users, error: null }) }) }) };
      }
      if (table === 'user_ai_credit_accounts_cache') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: cache, error: null }) }) }),
          upsert: (payload: any) => {
            calls.upsertPayload = payload;
            return Promise.resolve({ error: null });
          },
        };
      }
      return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) };
    },
  };
  return { db, calls };
}

const env = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  SSO_SERVICE: { getCareerCredits: async () => ({ok: true, account_id: 'acct-1', product_id: PRODUCT}) },
} as any;
const account = (revision: number) => ({
  id: 'acct-1', user_id: 'u-1', product_id: PRODUCT, scope: 'career_ai',
  granted_credits: '30', spent_credits: '5', revision,
});

describe('credit balance sync', () => {
  it('applies newer revisions to the display cache', async () => {
    const { db, calls } = makeDbMock({ id: 'u-1' }, { revision: 2 });
    const svc: any = new SyncService(env);
    svc.db = db;
    const res = await svc.syncCreditBalance({ account: account(3) });
    expect(res.success).toBe(true);
    expect(calls.upsertPayload).toMatchObject({ id: 'acct-1', revision: 3, spent_credits: '5' });
  });

  it('acks stale revisions without writing', async () => {
    const { db, calls } = makeDbMock({ id: 'u-1' }, { revision: 5 });
    const svc: any = new SyncService(env);
    svc.db = db;
    const res = await svc.syncCreditBalance({ account: account(3) });
    expect(res.success).toBe(true);
    expect(calls.upsertPayload).toBeNull();
  });

  it('rejects malformed products and foreign scopes', async () => {
    const { db } = makeDbMock({ id: 'u-1' }, null);
    const svc: any = new SyncService(env);
    svc.db = db;
    const malformedProduct = await svc.syncCreditBalance({ account: { ...account(4), product_id: 'other' } });
    expect(malformedProduct.success).toBe(false);
    const missingProduct = await svc.syncCreditBalance({ account: { ...account(4), product_id: undefined } });
    expect(missingProduct.success).toBe(false);
    const wrongScope = await svc.syncCreditBalance({ account: { ...account(4), scope: 'other_ai' } });
    expect(wrongScope.success).toBe(false);
  });

  it('rejects a valid UUID for another product', async () => {
    const { db, calls } = makeDbMock({ id: 'u-1' }, null);
    const svc: any = new SyncService(env);
    svc.db = db;
    const res = await svc.syncCreditBalance({ account: { ...account(4), product_id: OTHER_PRODUCT } });
    expect(res.success).toBe(false);
    expect(calls.upsertPayload).toBeNull();
  });

  it('fails retryable without a local user shadow', async () => {
    const { db } = makeDbMock(null, null);
    const svc: any = new SyncService(env);
    svc.db = db;
    const res = await svc.syncCreditBalance({ account: account(4) });
    expect(res.success).toBe(false);
    expect(res.retryable).toBe(true);
  });
});
