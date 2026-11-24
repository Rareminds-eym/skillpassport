// @vitest-environment node
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { syncManagedSubscriptionStatus } from '../../shared/lib/subscription-management';

function database(error: unknown = null) {
  const query = {
    update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'historical' }, error }),
  };
  const from = vi.fn().mockReturnValue(query);
  return { supabase: { from } as unknown as SupabaseClient, from, query };
}

describe('Historical subscription management synchronization', () => {
  it('updates the selected purchase for the verified user without replacing another subscription', async () => {
    const db = database();
    await syncManagedSubscriptionStatus(db.supabase, 'buyer', 'historical', 'cancelled', { id: 'historical', status: 'cancelled' });
    expect(db.from).toHaveBeenCalledWith('subscription_cache');
    expect(db.query.eq.mock.calls).toEqual([['id', 'historical'], ['user_id', 'buyer']]);
    expect(db.query.update).toHaveBeenCalledWith({ status: 'cancelled', synced_at: expect.any(String) });
  });
  it.each([null, {}, { id: 'other', status: 'cancelled' }, { id: 'historical', status: 'active' }])('rejects an unconfirmed owner result: %j', async canonical => {
    const db = database();
    await expect(syncManagedSubscriptionStatus(db.supabase, 'buyer', 'historical', 'cancelled', canonical)).rejects.toThrow('not confirmed');
    expect(db.from).not.toHaveBeenCalled();
  });
  it('does not report success when the local display failed to synchronize', async () => {
    const db = database({ message: 'database unavailable' });
    await expect(syncManagedSubscriptionStatus(db.supabase, 'buyer', 'historical', 'paused', { id: 'historical', status: 'paused' })).rejects.toThrow('still synchronizing');
  });
});
