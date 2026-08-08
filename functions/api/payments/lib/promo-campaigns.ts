/**
 * Promo Campaigns Provider
 *
 * DB-driven campaign lookup and plan transformation helpers.
 * Replaces hardcoded COLLEGE_LEARNER_* constants across handlers.
 *
 * See docs/LINK_BASED_SUBSCRIPTION_PRICING_README.md §6.2
 */

import type { getServiceClient } from '../../../lib/supabase';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('payments:promo-campaigns');

export interface PromoCampaign {
  id: string;
  code: string;
  name: string | null;
  applicable_role?: string;
  locked_plan_codes: string[];
  price_overrides: Record<string, { yearly: number }>;
  is_active: boolean;
}

/**
 * Look up an active campaign by promo code.
 * Returns null if code is empty, not found, or inactive.
 * Fail-closed: missing campaign = no overrides applied.
 */
export async function getPromoCampaign(
  supabase: ReturnType<typeof getServiceClient>,
  code: string,
): Promise<PromoCampaign | null> {
  if (!code) return null;

  const { data, error } = await supabase
    .from('promo_campaigns')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    // Non-critical: log and fail-closed (no campaign applied)
    logger.warn('promo_campaign_lookup_failed', { error: error.message });
    return null;
  }

  return data as PromoCampaign | null;
}

const PLAN_CODE_ALIASES: Record<string, string[]> = {
  freemium: ['freemium', 'discover'],
  discover: ['freemium', 'discover'],
  basic: ['basic', 'skill_starter', 'skillstarter'],
  skill_starter: ['basic', 'skill_starter', 'skillstarter'],
  skillstarter: ['basic', 'skill_starter', 'skillstarter'],
  professional: ['professional', 'career_builder', 'careerbuilder'],
  career_builder: ['professional', 'career_builder', 'careerbuilder'],
  careerbuilder: ['professional', 'career_builder', 'careerbuilder'],
  premium: ['premium', 'career_accelerator', 'careeraccelerator'],
  career_accelerator: ['premium', 'career_accelerator', 'careeraccelerator'],
  careeraccelerator: ['premium', 'career_accelerator', 'careeraccelerator'],
};

function getAliases(planCode: string): string[] {
  const code = (planCode || '').toLowerCase().trim();
  return PLAN_CODE_ALIASES[code] || [code];
}

/**
 * Check if a plan_code is locked by this campaign.
 */
export function isPlanLockedByCampaign(campaign: PromoCampaign, planCode: string): boolean {
  const aliases = getAliases(planCode);
  const locked = (campaign.locked_plan_codes || []).map((c) => c.toLowerCase().trim());
  return aliases.some((alias) => locked.includes(alias));
}

/**
 * Get the campaign's override price for a plan, or null if no override.
 * Campaigns price yearly only — plans are yearly-billed.
 */
export function campaignPriceForPlan(
  campaign: PromoCampaign,
  planCode: string,
): number | null {
  const aliases = getAliases(planCode);
  const overrides = campaign.price_overrides || {};
  const byKey: Record<string, { yearly: number }> = {};
  for (const [key, value] of Object.entries(overrides)) {
    byKey[key.toLowerCase().trim()] = value;
  }
  for (const alias of aliases) {
    const override = byKey[alias];
    if (override && override.yearly != null) {
      return override.yearly!;
    }
  }
  return null;
}

/**
 * Apply campaign rules (locks + price overrides) to a list of transformed plans.
 * Plans in locked_plan_codes get isDisabled/hidePrice flags.
 * Plans with price_overrides get their price/yearlyPrice replaced.
 */
export function applyCampaignToPlans(
  plans: Record<string, unknown>[],
  campaign: PromoCampaign,
): Record<string, unknown>[] {
  return plans.map((plan) => {
    const planCode = String(plan.plan_code || '').toLowerCase();
    const isLocked = isPlanLockedByCampaign(campaign, planCode);

    // Price override (yearly-only — plans are yearly-billed)
    const yearlyOverride = campaignPriceForPlan(campaign, planCode);

    return {
      ...plan,
      // Lock flags
      recommended: isLocked ? false : plan.recommended,
      hidePrice: isLocked,
      isDisabled: isLocked,
      availabilityLabel: isLocked ? 'Not available' : undefined,
      actionLabel: isLocked ? 'Get Started' : undefined,
      // Price override (only if campaign provides it for this plan)
      ...(yearlyOverride != null && { price: yearlyOverride, yearlyPrice: yearlyOverride }),
    };
  });
}
