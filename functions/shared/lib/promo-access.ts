import { promoQuotaAvailable } from './promo-quota';
import type { SupabaseClient } from '@supabase/supabase-js';

const roles = ['learner', 'school_admin', 'college_admin'];
interface Profile { role?: string | null; metadata?: Record<string, unknown> | null }

/** A stored, applicable promo requires paid coverage; never consume quota during access checks. */
export async function promoPaymentRequired(database: SupabaseClient, userId: string, profile?: Profile): Promise<boolean> {
  if (!profile) {
    const result = await database.from('users').select('role, metadata').eq('id', userId).maybeSingle();
    if (result.error || !result.data) throw new Error('Unable to verify promo account');
    profile = result.data as Profile;
  }
  if (!profile.role || !roles.includes(profile.role)) return false;
  // Accepted campaigns are durable account obligations, independent of editable signup metadata.
  const saved = await database.from('promo_redemptions').select('role, accepted_plan_id')
    .eq('user_id', userId).eq('role', profile.role).not('accepted_plan_id', 'is', null).limit(1).maybeSingle();
  if (saved.error) throw new Error('Unable to verify saved promo requirements');
  if (saved.data?.role === profile.role && saved.data.accepted_plan_id) return true;
  const code = String(profile.metadata?.referralCode || profile.metadata?.referral_code || '').trim().toUpperCase();
  if (!code) return false;
  const campaign = await database.from('promo_codes').select('id, active, starts_at, expires_at, role_quotas, overall_max_uses').eq('code', code).maybeSingle();
  if (campaign.error) throw new Error('Unable to verify promo requirements');
  if (!campaign.data) return false;
  const start = Date.parse(campaign.data.starts_at), end = Date.parse(campaign.data.expires_at);
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error('Invalid promo validity dates');
  if (campaign.data.active !== true || start > Date.now() || Date.now() > end
    || !Object.hasOwn(campaign.data.role_quotas ?? {}, profile.role)) return false;
  return promoQuotaAvailable(database, campaign.data.id, profile.role, Number(campaign.data.overall_max_uses), Number(campaign.data.role_quotas[profile.role]));
}
