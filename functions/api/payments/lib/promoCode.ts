/**
 * DIDAC 2026 promo-code lookups for the subscription/payment handlers.
 *
 * R16/R17: quota is consumed ONLY by an explicit, re-validated "accept this
 * offer" action (functions/lib/subscriptions/promo-offer.ts), which calls
 * confirmPromoRedemption() with the exact offer snapshot (canonical plan,
 * published-offer revision, exact price, duration) being accepted. There is
 * no automatic/background redemption anywhere else — the former withAuth()
 * fire-and-forget hook and functions/lib/promo-redemption.ts have been
 * removed. getAcceptedOfferSnapshot() is the read-only counterpart other
 * call sites (legacy /api/payments handlers, checkout) use to find out
 * whether this user has already explicitly accepted an offer, without ever
 * committing one themselves.
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
  /** This code's own plan override (promo_codes.target_plan_code), or null/undefined to use the role default (DIDAC_ALLOWED_PLAN_CODE_BY_ROLE). */
  targetPlanCode?: string | null;
  /** This code's exact promotional price in minor units (promo_codes.fixed_price_minor), or null/undefined when this code uses the plain additive priceAdjustment instead. */
  fixedPriceMinor?: number | null;
}

/**
 * Accepted_Offer_Snapshot (PRD R17): the exact, immutable terms a user
 * explicitly accepted — canonical plan id, published-offer revision/version,
 * exact final price, duration, and the acceptance timestamp. Written once,
 * atomically with the quota redemption itself (redeem_promo_code()); never
 * updated afterwards.
 */
export interface PromoOfferSnapshot {
  planId: string;
  revisionId: string;
  revisionNumber: number;
  priceId: string;
  currency: string;
  minorUnit: number;
  intervalUnit: 'month' | 'year';
  intervalCount: number;
  amountMinor: number;
  acceptedAt: string;
}

export interface PromoAcceptedRedemptionResult extends PromoRedemptionResult {
  offer: PromoOfferSnapshot;
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

/**
 * Matches a plan against the role's default eligible plan, OR — when the specific code being
 * redeemed has its own target_plan_code (promo_codes.target_plan_code, see checkPromoEligibility)
 * — against that override instead. Both match against plan_code OR plan name: in the live SSO
 * catalog, plan_code is an opaque per-plan hash (`pln_<32 hex>`), not a stable human-typeable
 * slug, so an admin-configured override is only usable at all if it can also resolve by the
 * plan's display name (e.g. "Career Builder") — mirroring the original learner-only check's dual
 * matching, which existed for the same reason (plan_code isn't reliably the fixed-constant slug).
 */
export function isDidacAllowedPlan(
  role: unknown,
  plan: { plan_code?: unknown; name?: unknown },
  targetPlanCode?: string | null,
): boolean {
  if (!isSupportedPromoRole(role)) return false;
  const planCode = String(plan.plan_code || '').trim().toLowerCase();
  const planName = String(plan.name || '').trim().toLowerCase();
  if (targetPlanCode) {
    const target = targetPlanCode.trim().toLowerCase();
    return planCode === target || planName === target;
  }
  return planCode === DIDAC_ALLOWED_PLAN_CODE_BY_ROLE[role] || planName === DIDAC_ALLOWED_PLAN_NAME_BY_ROLE[role];
}

/**
 * Read-only: which plan_code the given code overrides eligibility to, or null if it has none
 * (role default applies) or doesn't exist/cover this role. Lets call sites that only have a
 * plan row in hand (not a full catalog list to search) still resolve the per-code override
 * before calling isDidacAllowedPlan — used by the legacy /api/payments handlers, which (unlike
 * discovery.ts's findEligiblePromoOffer) don't already have checkPromoEligibility's result.
 */
export async function resolveDidacTargetPlanCode(
  supabase: ReturnType<typeof getServiceClient>,
  role: unknown,
  storedReferralCode: unknown,
): Promise<string | null> {
  const code = normalizePromoCode(storedReferralCode);
  if (!code || !isSupportedPromoRole(role)) return null;
  try {
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('role_quotas, target_plan_code')
      .eq('code', code)
      .maybeSingle();
    if (!promo) return null;
    const roleQuotas = (promo.role_quotas || {}) as Record<string, unknown>;
    if (!(role in roleQuotas)) return null;
    return (promo.target_plan_code as string | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Looks up a user's stored role and referralCode (public.users.metadata /
 * public.users.role) by user id. Mirrors the lookup in
 * functions/api/payments/handlers/subscription-plans.ts'
 * getStoredReferralCodeAndRole(), kept here too (rather than imported from
 * that handler) so this module has no dependency on the legacy /api/payments
 * handler tree — the new /api/subscriptions/* commerce path reuses this
 * copy instead.
 */
export async function getStoredReferralCodeAndRole(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string | null,
): Promise<{ referralCode: string; role: string | null }> {
  if (!userId) return { referralCode: '', role: null };
  const { data } = await supabase
    .from('users')
    .select('metadata, role')
    .eq('id', userId)
    .maybeSingle();
  const metadata = (data?.metadata || {}) as Record<string, unknown>;
  return {
    referralCode: normalizePromoCode(metadata.referralCode || metadata.referral_code),
    role: (data?.role as string) || null,
  };
}

/**
 * Read-only eligibility preview: is this code currently active, in its date
 * window, and does it cover this role — WITHOUT committing a redemption or
 * consuming a quota slot. Used to decide whether to compute a bounded price
 * adjustment for an in-progress checkout quote; the atomic, race-safe enforcement
 * of quota (overall and per-role) still happens only in redeem_promo_code(),
 * called via confirmPromoRedemption() at actual checkout settlement. A
 * narrow race is possible (eligible here, quota exhausted by the time
 * settlement calls confirmPromoRedemption()) — accepted as a known, rare
 * edge case rather than blocking checkout on a second atomic check; the
 * resulting purchase just keeps a discount that technically arrived a moment
 * too late for the bookkeeping, never a double-redeemed or over-quota state.
 */
export async function checkPromoEligibility(
  supabase: ReturnType<typeof getServiceClient>,
  role: string | null,
  storedReferralCode: unknown,
): Promise<PromoRedemptionResult | null> {
  const code = normalizePromoCode(storedReferralCode);
  if (!code || !isSupportedPromoRole(role)) return null;
  try {
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('id, active, starts_at, expires_at, price_adjustment, role_quotas, overall_max_uses, target_plan_code, fixed_price_minor')
      .eq('code', code)
      .maybeSingle();
    if (!promo || promo.active !== true) return null;
    const now = Date.now();
    if (now < new Date(promo.starts_at as string).getTime() || now > new Date(promo.expires_at as string).getTime()) return null;
    const roleQuotas = (promo.role_quotas || {}) as Record<string, unknown>;
    if (!(role in roleQuotas)) return null;
    return {
      promoCodeId: promo.id as string,
      priceAdjustment: Number(promo.price_adjustment ?? 0),
      targetPlanCode: (promo.target_plan_code as string | null) ?? null,
      fixedPriceMinor: promo.fixed_price_minor == null ? null : Number(promo.fixed_price_minor),
    };
  } catch {
    return null;
  }
}

function offerFromRpcResult(result: Record<string, unknown>): PromoOfferSnapshot | null {
  const offer = result?.offer as Record<string, unknown> | undefined;
  if (!offer || !offer.planId) return null;
  return {
    planId: offer.planId as string,
    revisionId: offer.revisionId as string,
    revisionNumber: Number(offer.revisionNumber),
    priceId: offer.priceId as string,
    currency: offer.currency as string,
    minorUnit: Number(offer.minorUnit),
    intervalUnit: offer.intervalUnit as 'month' | 'year',
    intervalCount: Number(offer.intervalCount),
    amountMinor: Number(offer.amountMinor),
    acceptedAt: offer.acceptedAt as string,
  };
}

/**
 * Explicit offer acceptance (PRD R16/R17) — the ONLY way promo quota is ever
 * consumed. Commits (atomically, together) the quota redemption and the
 * immutable accepted-offer snapshot for this user+role+code, or — if this
 * user already accepted an offer for this code — returns that original,
 * unchanged snapshot (re-acceptance is a safe, idempotent no-op; the
 * previously committed offer is never replaced by a newly supplied one).
 * Returns null if the code doesn't exist, doesn't cover this role, or
 * redemption is otherwise rejected (expired/inactive/exhausted) or fails
 * transiently.
 */
export async function confirmPromoRedemption(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string | null,
  role: string | null,
  storedReferralCode: unknown,
  offer: PromoOfferSnapshot,
): Promise<PromoAcceptedRedemptionResult | null> {
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
      p_accepted_plan_id: offer.planId,
      p_accepted_revision_id: offer.revisionId,
      p_accepted_revision_number: offer.revisionNumber,
      p_accepted_price_id: offer.priceId,
      p_accepted_currency: offer.currency,
      p_accepted_minor_unit: offer.minorUnit,
      p_accepted_interval_unit: offer.intervalUnit,
      p_accepted_interval_count: offer.intervalCount,
      p_accepted_amount_minor: offer.amountMinor,
    });
    if (error) return null;

    const result = data as Record<string, unknown>;
    if (result?.success !== true) return null;
    const committed = offerFromRpcResult(result);
    if (!committed) return null;

    return {
      promoCodeId: promo.id as string,
      priceAdjustment: Number(promo.price_adjustment ?? 0),
      offer: committed,
    };
  } catch {
    return null;
  }
}

/**
 * Read-only: has this user already explicitly accepted an offer for their
 * stored referral code? Never commits a redemption. Used by every surface
 * (legacy pricing handlers, new-architecture checkout) that must apply the
 * promo's price adjustment only once it has actually been accepted.
 */
export async function getAcceptedOfferSnapshot(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string | null,
  role: string | null,
  storedReferralCode: unknown,
): Promise<PromoAcceptedRedemptionResult | null> {
  const code = normalizePromoCode(storedReferralCode);
  if (!code || !userId || !isSupportedPromoRole(role)) return null;
  try {
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('id, price_adjustment')
      .eq('code', code)
      .maybeSingle();
    if (!promo) return null;

    const { data: redemption } = await supabase
      .from('promo_redemptions')
      .select('role, accepted_plan_id, accepted_revision_id, accepted_revision_number, accepted_price_id, accepted_currency, accepted_minor_unit, accepted_interval_unit, accepted_interval_count, accepted_amount_minor, accepted_at')
      .eq('promo_code_id', promo.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (!redemption || redemption.role !== role || !redemption.accepted_plan_id) return null;

    return {
      promoCodeId: promo.id as string,
      priceAdjustment: Number(promo.price_adjustment ?? 0),
      offer: {
        planId: redemption.accepted_plan_id as string,
        revisionId: redemption.accepted_revision_id as string,
        revisionNumber: Number(redemption.accepted_revision_number),
        priceId: redemption.accepted_price_id as string,
        currency: redemption.accepted_currency as string,
        minorUnit: Number(redemption.accepted_minor_unit),
        intervalUnit: redemption.accepted_interval_unit as 'month' | 'year',
        intervalCount: Number(redemption.accepted_interval_count),
        amountMinor: Number(redemption.accepted_amount_minor),
        acceptedAt: redemption.accepted_at as string,
      },
    };
  } catch {
    return null;
  }
}
