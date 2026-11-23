/**
 * DIDAC 2026 promo-code lookups for the subscription/payment handlers.
 *
 * confirmPromoRedemption() calls the same redeem_promo_code() RPC that
 * functions/lib/auth.ts withAuth() dispatches fire-and-forget. Calling it
 * again here — synchronously, on the read path — closes the race where a
 * user's very first subscription-plans fetch can land before that earlier
 * fire-and-forget write commits: redeem_promo_code()'s existing-redemption
 * check (checked first, inside a FOR UPDATE row lock) makes a repeat call
 * for an already-redeemed user a cheap, safe no-op, so this never double-
 * redeems or fails the read when withAuth()'s hook already won the race.
 *
 * See TSD-didac-2026-dynamic-promo-code-management.yml (v2.1) for the full
 * design.
 *
 * @module api/payments/lib/promoCode
 */
import type { getServiceClient } from '../../../lib/supabase';

const SUPPORTED_PROMO_ROLES = ['learner', 'school_admin', 'college_admin'] as const;
export type PromoRole = (typeof SUPPORTED_PROMO_ROLES)[number];

export interface PromoRedemptionResult {
  promoCodeId: string;
  priceAdjustment: number;
}

const normalizePromoCode = (code: unknown): string => String(code || '').trim().toUpperCase();

// Which plan a DIDAC promo code makes eligible (and thus price-adjusted) for
// each supported role is not itself promo-code-configurable (promo_codes
// stores only role_quotas and a single price_adjustment, not per-code plan
// targeting — see TSD v2.1). These remain fixed constants, shared by every
// handler that needs to know "is this the one eligible plan for this role"
// (subscription-plans.ts, create-order.ts, verify-payment.ts), so the
// eligible-plan definition can't drift between them.
export const DIDAC_ALLOWED_PLAN_CODE_BY_ROLE: Record<PromoRole, string> = {
  learner: 'skill_starter',
  college_admin: 'college_starter',
  school_admin: 'school_starter',
};
const DIDAC_ALLOWED_PLAN_NAME_BY_ROLE: Record<PromoRole, string> = {
  learner: 'skill starter',
  college_admin: 'college starter',
  school_admin: 'school starter',
};

export function isSupportedPromoRole(role: unknown): role is PromoRole {
  return typeof role === 'string' && (SUPPORTED_PROMO_ROLES as readonly string[]).includes(role);
}

/** Matches by plan_code first, falling back to name — mirrors the original learner-only check's dual matching (plan_code may not always be populated consistently with the fixed-constant slug). */
export function isDidacAllowedPlan(role: unknown, plan: { plan_code?: unknown; name?: unknown }): boolean {
  if (!isSupportedPromoRole(role)) return false;
  const planCode = String(plan.plan_code || '').trim().toLowerCase();
  const planName = String(plan.name || '').trim().toLowerCase();
  return planCode === DIDAC_ALLOWED_PLAN_CODE_BY_ROLE[role] || planName === DIDAC_ALLOWED_PLAN_NAME_BY_ROLE[role];
}

/**
 * Confirms (committing if not already committed) a promo redemption for this
 * user+role+code, then returns the price_adjustment to apply, or null if the
 * code doesn't exist, doesn't cover this role, or redemption is otherwise
 * rejected (expired/inactive/exhausted) or fails transiently. Never throws —
 * a transient DB error here just means this particular page load shows
 * unadjusted pricing; the next load (or withAuth()'s own fire-and-forget
 * hook) retries safely, since the RPC call is idempotent.
 */
export async function confirmPromoRedemption(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string | null,
  role: string | null,
  storedReferralCode: unknown,
): Promise<PromoRedemptionResult | null> {
  const code = normalizePromoCode(storedReferralCode);
  if (!code || !userId || !isSupportedPromoRole(role)) return null;

  try {
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('id, price_adjustment, role_quotas')
      .eq('code', code)
      .maybeSingle();
    if (!promo) return null;

    const roleQuotas = (promo.role_quotas || {}) as Record<string, unknown>;
    if (!(role in roleQuotas)) return null;

    const { data, error } = await supabase.rpc('redeem_promo_code', {
      p_code: code,
      p_user_id: userId,
      p_role: role,
    });
    if (error) return null;

    const result = data as Record<string, unknown>;
    if (result?.success !== true) return null;

    return {
      promoCodeId: promo.id as string,
      priceAdjustment: Number(promo.price_adjustment ?? 0),
    };
  } catch {
    return null;
  }
}
