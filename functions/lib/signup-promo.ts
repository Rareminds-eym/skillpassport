import type { SupabaseClient } from '@supabase/supabase-js';
import { promoQuotaAvailable } from '../shared/lib/promo-quota';

/** Read-only pre-signup check. Checkout still revalidates and reserves quota atomically. */
export async function signupPromoValid(db: SupabaseClient, code: string, role: string, now = Date.now()): Promise<boolean> {
  if (!['learner', 'school_admin', 'college_admin'].includes(role)) return false;
  const { data: promo, error } = await db.from('promo_codes')
    .select('id,active,starts_at,expires_at,role_quotas,overall_max_uses')
    .eq('code', code.trim().toUpperCase()).maybeSingle();
  if (error) throw error;
  if (!promo || promo.active !== true) return false;
  const start = Date.parse(promo.starts_at), end = Date.parse(promo.expires_at);
  if (!Number.isFinite(start) || !Number.isFinite(end) || now < start || now >= end) return false;
  const quotas = promo.role_quotas || {};
  if (!(role in quotas)) return false;
  return promoQuotaAvailable(db, promo.id, role, Number(promo.overall_max_uses), Number(quotas[role]));
}
