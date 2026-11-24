/**
 * DIDAC 2026 — explicit promo-offer acceptance (PRD R16/R17).
 *
 * This is the ONLY place promo quota is ever consumed. There is no automatic
 * or background redemption anywhere else in the application: the user must
 * POST here to explicitly accept the offer currently being shown, which
 * re-derives the live terms fresh (never trusting anything client-supplied),
 * and atomically commits the quota redemption together with an immutable
 * snapshot of exactly what was accepted (canonical plan, published-offer
 * revision/version, exact price, duration, acceptance timestamp). Checkout
 * (see ./commerce.ts's computePromoAdjustment) reads this stored snapshot
 * instead of ever recomputing a fresh price.
 *
 * See TSD-didac-2026-dynamic-promo-code-management.yml (v2.1) and
 * Rareminds_DIDAC_Dynamic_Promo_Code_and_Sector_Pricing_PRD_v1.3 (R16/R17).
 *
 * @module lib/subscriptions/promo-offer
 */
import { confirmPromoRedemption, getAcceptedOfferSnapshot, getStoredReferralCodeAndRole, isSupportedPromoRole } from '../../api/payments/lib/promoCode';
import { getServiceClient } from '../supabase';
import { subscriptionConsumerEndpoint, subscriptionFailure, subscriptionResponseHeaders } from './current-subscription';
import { fetchAcceptableOffer } from './discovery';

export const subscriptionPromoOfferEndpoint = subscriptionConsumerEndpoint('POST', async context => {
  if ([...new URL(context.request.url).searchParams].length) return subscriptionFailure(400);
  const supabase = getServiceClient(context.env as Parameters<typeof getServiceClient>[0]);
  const { referralCode, role } = await getStoredReferralCodeAndRole(supabase, context.actorId);
  if (!referralCode || !isSupportedPromoRole(role)) {
    return Response.json({ error: 'No promo offer to accept' }, { status: 404, headers: subscriptionResponseHeaders });
  }

  // Re-acceptance is a safe, idempotent read of the ALREADY-committed, immutable snapshot — it
  // never re-derives or replaces it, satisfying R17 even if this endpoint is called again.
  const existing = await getAcceptedOfferSnapshot(supabase, context.actorId, role, referralCode);
  if (existing) return Response.json({ accepted: true, offer: existing.offer }, { headers: subscriptionResponseHeaders });

  // R16: always re-derive the live, current terms at the moment of acceptance — never trust a
  // client-supplied plan/price/revision for what is being accepted.
  const offer = await fetchAcceptableOffer(context);
  if (!offer) return Response.json({ error: 'No eligible promo offer available' }, { status: 404, headers: subscriptionResponseHeaders });

  const redemption = await confirmPromoRedemption(supabase, context.actorId, role, referralCode, { ...offer, acceptedAt: new Date().toISOString() });
  if (!redemption) return Response.json({ error: 'Promo offer could not be accepted' }, { status: 409, headers: subscriptionResponseHeaders });

  return Response.json({ accepted: true, offer: redemption.offer }, { headers: subscriptionResponseHeaders });
});
