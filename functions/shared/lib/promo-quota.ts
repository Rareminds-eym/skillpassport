import type { SupabaseClient } from '@supabase/supabase-js';

/** Preview only; the redemption RPC rechecks both limits under its campaign row lock. */
export async function promoQuotaAvailable(database: SupabaseClient, campaignId: string, role: string, overallMax: number, roleMax: number) {
  if (!Number.isSafeInteger(overallMax) || !Number.isSafeInteger(roleMax) || overallMax < 0 || roleMax < 0) throw new Error('Invalid promo quotas');
  if (overallMax === 0 || roleMax === 0) return false;
  const [overall, scoped] = await Promise.all([
    database.from('promo_redemptions').select('id', { count: 'exact', head: true }).eq('promo_code_id', campaignId),
    database.from('promo_redemptions').select('id', { count: 'exact', head: true }).eq('promo_code_id', campaignId).eq('role', role),
  ]);
  if (overall.error || scoped.error || overall.count === null || scoped.count === null) throw new Error('Unable to verify promo quota');
  return overall.count < overallMax && scoped.count < roleMax;
}
