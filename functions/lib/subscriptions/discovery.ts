import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkPromoEligibility, getAcceptedOfferSnapshot, getStoredReferralCodeAndRole, isDidacAllowedPlan, type PromoOfferSnapshot } from '../../api/payments/lib/promoCode';
import { getServiceClient } from '../supabase';
import { applicationFeatureDefinition, catalogInventoryDatabase, readApplicationFeatureInventory } from './catalog-inventory';
import { subscriptionConsumerEndpoint, subscriptionFailure, subscriptionResponseHeaders } from './current-subscription';
import { readApplicationPlanProjection } from './publication';

const reference = z.string().uuid().transform(value => value.toLowerCase());
const text = z.string().min(1).refine(value => value === value.trim());
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const subject = z.object({ kind: z.enum(['user', 'organization']), id: reference }).strict();
const operation = z.enum(['upgrade', 'renew', 'downgrade', 'cancel', 'expire', 'payment_failed', 'suspend', 'reactivate']);
const binding = z.object({
  id: reference, planId: reference, productId: reference, subject,
  status: z.enum(['active', 'pending', 'paused', 'cancelled', 'expired', 'grace_period']),
  kind: z.enum(['initialized', 'uninitialized']), revisionId: reference.nullable(), version: integer.min(1).nullable(),
  lifecycleOperations: z.array(operation).max(operation.options.length).refine(items => new Set(items).size === items.length),
}).strict().superRefine((value, context) => {
  if (value.kind === 'initialized' ? value.revisionId === null || value.version === null
    : value.revisionId !== null || value.version !== null || value.lifecycleOperations.length > 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Incomplete execution binding' });
  }
});
const discovery = z.object({
  schemaVersion: z.literal(1), actorId: reference, productId: reference,
  items: z.array(binding).max(50), nextCursor: reference.nullable()
}).strict();
const audiences = z.array(text).min(1).max(200).refine(items => new Set(items).size === items.length);
const limit = z.discriminatedUnion('kind', [z.object({ kind: z.literal('finite'), value: integer }).strict(),
z.object({ kind: z.literal('unlimited') }).strict(), z.object({ kind: z.literal('contract_required') }).strict()]);
const feature = z.discriminatedUnion('type', [
  z.object({ key: text, type: z.literal('boolean'), enabled: z.boolean() }).strict(),
  z.object({ key: text, type: z.literal('numeric_limit'), enabled: z.boolean(), limit }).strict(),
  z.object({
    key: text, type: z.literal('metered'), enabled: z.boolean(), limit: z.union([
      limit, z.object({ kind: z.literal('allocation_policy') }).strict(),
    ])
  }).strict(),
  z.object({ key: text, type: z.literal('enum'), enabled: z.boolean(), value: text.nullable() }).strict(),
]);
const publishedSubscriptionPlanShape = {
  plan: z.object({ id: reference, code: z.string().regex(/^pln_[0-9a-f]{32}$/), productId: reference }).strict(),
  revisionId: reference, revisionNumber: integer.min(1), name: text, audiences,
  purchaseMode: z.enum(['free', 'self_service', 'contact_sales']),
  prices: z.array(z.object({
    id: reference, currency: z.string().regex(/^[A-Z]{3}$/), minorUnit: integer,
    amountMinor: integer, intervalUnit: z.enum(['month', 'year']), intervalCount: integer.min(1),
    quantityBasis: z.enum(['subscription', 'seat']), audiences
  }).strict()).max(1000),
  features: z.array(feature).max(1000).refine(items => new Set(items.map(item => item.key)).size === items.length),
};
function freeOfferHasNoPrice(value: { purchaseMode: string; prices: unknown[] }, context: z.RefinementCtx) {
  if (value.purchaseMode === 'free' && value.prices.length !== 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['prices'], message: 'Free offer cannot contain checkout prices' });
  }
}
export const publishedSubscriptionPlanSchema = z.object(publishedSubscriptionPlanShape).strict().superRefine(freeOfferHasNoPrice);
/** Display terms from the owner's immutable published configuration; never inferred from names or prices. */
export const publishedPresentationSchema = z.object({
  priceLabel: z.enum(['exact', 'starting_at']), taxInclusive: z.boolean(),
  badge: z.string().min(1).max(200).refine(value => value === value.trim()).nullable(),
  // Owner card copy for offers such as Hybrid; null when the published configuration has none.
  copy: z.object({ tagline: text, positioning: text, description: text, priceText: text, termsNote: text,
    highlights: z.array(text).min(1).max(12) }).strict().nullable()
}).strict();
export const catalogTaxSchema = z.object({
  kind: z.literal('gst'), rateBasisPoints: integer.min(1).max(10000),
  priceDisplay: z.enum(['exclusive', 'inclusive'])
}).strict();
const listedPlanSchema = z.object({ ...publishedSubscriptionPlanShape, presentation: publishedPresentationSchema }).strict().superRefine(freeOfferHasNoPrice);
function taxDisplayMatches(value: { tax: { priceDisplay: string }; plans: { presentation: { taxInclusive: boolean } }[] }, context: z.RefinementCtx) {
  if (value.plans.some(plan => plan.presentation.taxInclusive !== (value.tax.priceDisplay === 'inclusive'))) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['plans'], message: 'Plan tax display differs from the tax policy' });
  }
}
/** Super-administrator view: every published, available offer, across audiences. */
export const administrationCatalogSchema = z.object({ schemaVersion: z.literal(1), actorId: reference, productId: reference,
  tax: catalogTaxSchema, plans: z.array(listedPlanSchema).max(50), nextCursor: reference.nullable() }).strict().superRefine(taxDisplayMatches);
// `audience` is the single owner audience this actor may browse (null: none); every listed plan must serve it.
const catalog = z.object({
  schemaVersion: z.literal(1), actorId: reference, productId: reference, audience: text.nullable(),
  subjectKind: z.enum(['user', 'organization']).nullable(), tax: catalogTaxSchema,
  plans: z.array(listedPlanSchema).max(50),
  nextCursor: reference.nullable()
}).strict().superRefine((value, context) => {
  if ((value.audience === null) !== (value.subjectKind === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['subjectKind'], message: 'Buyer subject must accompany the audience' });
  }
  if (value.plans.some(plan => value.audience === null || !plan.audiences.includes(value.audience))) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['plans'], message: 'Listed plan is outside the actor audience' });
  }
  taxDisplayMatches(value, context);
});
export function readCursor(request: Request) {
  const parameters = [...new URL(request.url).searchParams];
  if (parameters.length === 0) return { valid: true as const, cursor: null };
  if (parameters.length !== 1 || parameters[0][0] !== 'cursor') return { valid: false as const };
  const cursor = reference.safeParse(parameters[0][1]);
  return cursor.success ? { valid: true as const, cursor: cursor.data } : { valid: false as const };
}
export function pageScope(actorId: string, productId: string, page: { actorId: string; productId: string; nextCursor: string | null }, after: string | null,
  ids: readonly string[]) {
  const nextCursor = page.nextCursor;
  if (page.actorId !== actorId || page.productId !== productId || new Set(ids).size !== ids.length
    || ids.some((id, index) => (after !== null && id <= after) || (index > 0 && id <= ids[index - 1]))
    || (nextCursor !== null && ((after !== null && nextCursor <= after) || ids.some(id => id > nextCursor)))
    || (ids.length > 0 && page.nextCursor === null)) throw new Error('Subscription page owner scope differs');
}

export const subscriptionDiscoveryEndpoint = subscriptionConsumerEndpoint('GET', async context => {
  const input = readCursor(context.request);
  if (!input.valid) return subscriptionFailure(400);
  const raw = await context.env.SSO_SERVICE!.listSubscriptionExecutions(context.token, context.productId, input.cursor);
  if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(raw).success) return subscriptionFailure(403);
  const page = discovery.parse(raw);
  pageScope(context.actorId, context.productId, page, input.cursor, page.items.map(item => item.id));
  if (page.items.some(item => item.productId !== context.productId
    || (item.subject.kind === 'user' ? item.subject.id !== context.actorId : item.subject.id !== context.organizationId))) {
    throw new Error('Discovery subject differs');
  }
  return Response.json(page, { headers: subscriptionResponseHeaders });
});

/**
 * Best-effort: SkillPassport remains the sole authority on promo validity, role eligibility and
 * quota. This just names the one plan DIDAC makes this role eligible for and the plain, bounded
 * additive adjustment to apply to its one price serving this buyer's audience — SSO independently
 * derives the real published price itself and enforces its own fixed safety cap; no secret or
 * signature is involved. Any failure, ambiguity or ineligibility here just means no discount is
 * attempted — the caller falls back to the plain, already-fetched catalog page.
 */
interface CatalogPromoAdjustment { planId: string; priceAdjustmentMinor: number }
/** Richer version of CatalogPromoAdjustment carrying everything an Accepted_Offer_Snapshot (PRD R17) needs. */
export interface EligiblePromoOffer extends CatalogPromoAdjustment {
  revisionId: string; revisionNumber: number; priceId: string;
  currency: string; minorUnit: number; intervalUnit: 'month' | 'year'; intervalCount: number;
  baseAmountMinor: number;
}
async function findEligiblePromoOffer(
  env: Parameters<typeof getServiceClient>[0],
  actorId: string, page: z.infer<typeof catalog>,
): Promise<EligiblePromoOffer | null> {
  if (page.audience === null) return null;
  try {
    const supabase = getServiceClient(env);
    const { referralCode, role } = await getStoredReferralCodeAndRole(supabase, actorId);
    if (!referralCode || !role) return null;
    const eligibility = await checkPromoEligibility(supabase, role, referralCode);
    if (!eligibility) return null;
    const eligiblePlan = page.plans.find(plan => isDidacAllowedPlan(role, { plan_code: plan.plan.code, name: plan.name }, eligibility.targetPlanCode));
    if (!eligiblePlan) return null;
    const matchedPrices = eligiblePlan.prices.filter(price => price.audiences.includes(page.audience as string));
    if (matchedPrices.length !== 1) return null;
    const price = matchedPrices[0];
    // Two mutually exclusive pricing modes (promo_codes_pricing_mode_exclusive_check, DB-enforced):
    // a fixed promotional price (this code locks the plan to an exact amount, e.g. "₹399",
    // regardless of its live base price), or the original plain additive top-up on top of
    // whatever the plan's live price currently is. A zero/no-op adjustment means "apply nothing".
    const priceAdjustmentMinor = eligibility.fixedPriceMinor != null
      ? eligibility.fixedPriceMinor - price.amountMinor
      : Math.round(eligibility.priceAdjustment * 10 ** price.minorUnit);
    if (priceAdjustmentMinor < 1) return null;
    return {
      planId: eligiblePlan.plan.id, priceAdjustmentMinor,
      revisionId: eligiblePlan.revisionId, revisionNumber: eligiblePlan.revisionNumber, priceId: price.id,
      currency: price.currency, minorUnit: price.minorUnit, intervalUnit: price.intervalUnit, intervalCount: price.intervalCount,
      baseAmountMinor: price.amountMinor,
    };
  } catch {
    return null;
  }
}

/**
 * Explicit-acceptance support (PRD R16): re-derives, fresh, the one live offer this actor is
 * currently eligible for — always the CURRENT live terms, never anything client-supplied — so
 * that accepting an offer always snapshots exactly what is live at the moment of acceptance.
 * Fetches its own plain (unadjusted) first catalog page; never trusts a caller-supplied page.
 */
export async function fetchAcceptableOffer(context: { env: unknown; request: Request; token: string; actorId: string; productId: string }):
  Promise<Omit<PromoOfferSnapshot, 'acceptedAt'> | null> {
  try {
    const env = context.env as Parameters<typeof getServiceClient>[0] & { SSO_SERVICE?: { listPublishedSubscriptionPlans: typeof fetch } };
    const database = catalogInventoryDatabase(context.env as Parameters<typeof catalogInventoryDatabase>[0]);
    const features = (await readApplicationFeatureInventory(database)).map(item => {
      const { key, type, ...rest } = applicationFeatureDefinition(item);
      return { key, type, ...('options' in rest ? { options: rest.options } : {}) };
    });
    if (!(env as any).SSO_SERVICE) return null;
    const raw = await (env as any).SSO_SERVICE.listPublishedSubscriptionPlans(context.token, context.productId, features, null);
    if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(raw).success) return null;
    const page = catalog.parse(raw);
    pageScope(context.actorId, context.productId, page, null, page.plans.map(item => item.plan.id));
    await verifyPublishedTermsAgainstProjections(database, page.plans, context.productId);
    const offer = await findEligiblePromoOffer(env, context.actorId, page);
    if (!offer) return null;
    return {
      planId: offer.planId, revisionId: offer.revisionId, revisionNumber: offer.revisionNumber, priceId: offer.priceId,
      currency: offer.currency, minorUnit: offer.minorUnit, intervalUnit: offer.intervalUnit, intervalCount: offer.intervalCount,
      amountMinor: offer.baseAmountMinor + offer.priceAdjustmentMinor,
    };
  } catch {
    return null;
  }
}

/** Undoes exactly the one authorized plan/price adjustment so the strict projection check below runs unmodified. */
function revertAuthorizedCatalogAdjustment(plans: readonly z.infer<typeof listedPlanSchema>[], audience: string, adjustment: CatalogPromoAdjustment): readonly z.infer<typeof listedPlanSchema>[] {
  let reverted = false;
  return plans.map(plan => {
    if (plan.plan.id !== adjustment.planId) return plan;
    const prices = plan.prices.map(price => {
      if (reverted || !price.audiences.includes(audience)) return price;
      reverted = true;
      return { ...price, amountMinor: price.amountMinor - adjustment.priceAdjustmentMinor };
    });
    return { ...plan, prices };
  });
}

/** Locally overrides the accepted plan's matched price with the exact, immutable accepted amount — no further SSO round-trip or live recompute. */
function applyAcceptedOfferToPage(page: z.infer<typeof catalog>, offer: PromoOfferSnapshot): z.infer<typeof catalog> {
  let applied = false;
  const plans = page.plans.map(plan => {
    if (plan.plan.id !== offer.planId) return plan;
    const prices = plan.prices.map(price => {
      if (applied || price.id !== offer.priceId) return price;
      applied = true;
      return { ...price, amountMinor: offer.amountMinor };
    });
    return { ...plan, prices };
  });
  return { ...page, plans };
}

export const publishedSubscriptionCatalogEndpoint = subscriptionConsumerEndpoint('GET', async context => {
  const input = readCursor(context.request);
  if (!input.valid) return subscriptionFailure(400);
  const database = catalogInventoryDatabase(context.env);
  const features = (await readApplicationFeatureInventory(database)).map(item => {
    const { key, type, ...rest } = applicationFeatureDefinition(item);
    return { key, type, ...('options' in rest ? { options: rest.options } : {}) };
  });
  const raw = await context.env.SSO_SERVICE!.listPublishedSubscriptionPlans(context.token, context.productId, features, input.cursor);
  if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(raw).success) return subscriptionFailure(403);
  const page = catalog.parse(raw);
  pageScope(context.actorId, context.productId, page, input.cursor, page.plans.map(item => item.plan.id));
  await verifyPublishedTermsAgainstProjections(database, page.plans, context.productId);

  // R16/R17: once an offer has been explicitly accepted, the catalog must show the exact,
  // immutable accepted price forever — never recompute a fresh live adjustment for it again.
  const env = context.env as Parameters<typeof getServiceClient>[0];
  const supabase = getServiceClient(env);
  const { referralCode, role } = await getStoredReferralCodeAndRole(supabase, context.actorId);
  const accepted = referralCode && role ? await getAcceptedOfferSnapshot(supabase, context.actorId, role, referralCode) : null;
  if (accepted) {
    return Response.json({ ...applyAcceptedOfferToPage(page, accepted.offer), eligiblePlanId: accepted.offer.planId, offerAccepted: true },
      { headers: subscriptionResponseHeaders });
  }

  // Server-to-server only: SkillPassport decides the promo discount itself, from its own stored
  // referralCode/role/quota state — the browser never sees or supplies this value.
  const adjustment = await findEligiblePromoOffer(env, context.actorId, page);
  if (!adjustment) return Response.json({ ...page, eligiblePlanId: null, offerAccepted: false }, { headers: subscriptionResponseHeaders });

  const adjustedRaw = await context.env.SSO_SERVICE!.listPublishedSubscriptionPlans(
    context.token, context.productId, features, input.cursor, adjustment.planId, adjustment.priceAdjustmentMinor);
  if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(adjustedRaw).success) return subscriptionFailure(403);
  const adjustedPage = catalog.parse(adjustedRaw);
  pageScope(context.actorId, context.productId, adjustedPage, input.cursor, adjustedPage.plans.map(item => item.plan.id));
  if (adjustedPage.audience !== page.audience || adjustedPage.nextCursor !== page.nextCursor || adjustedPage.plans.length !== page.plans.length) {
    // A second call returning a structurally different page than the first is not a legitimate
    // discount outcome; fall back to the already-verified plain page rather than trust it.
    return Response.json({ ...page, eligiblePlanId: null, offerAccepted: false }, { headers: subscriptionResponseHeaders });
  }
  try {
    await verifyPublishedTermsAgainstProjections(database, revertAuthorizedCatalogAdjustment(adjustedPage.plans, page.audience as string, adjustment), context.productId);
  } catch {
    // The adjusted response doesn't reduce to the already-verified plain page under our own
    // authorized adjustment alone — never trust it; serve the plain, independently verified page.
    return Response.json({ ...page, eligiblePlanId: null, offerAccepted: false }, { headers: subscriptionResponseHeaders });
  }
  // Only the one DIDAC-mapped plan is promo-eligible; the frontend disables every other plan
  // card while this is non-null, and restores normal choices whenever it's null (no referral
  // code stored, code expired/exhausted, or any of the checks above didn't hold). offerAccepted
  // is false here: this price is still live/provisional until the user explicitly accepts it
  // (functions/lib/subscriptions/promo-offer.ts), which is the only thing that locks it in.
  return Response.json({ ...adjustedPage, eligiblePlanId: adjustment.planId, offerAccepted: false }, { headers: subscriptionResponseHeaders });
});

/** Every surface shows terms the application independently stored for the same revision (single catalog source). */
export async function verifyPublishedTermsAgainstProjections(database: SupabaseClient, plans: readonly z.infer<typeof listedPlanSchema>[], productId: string) {
  for (const terms of plans) {
    if (terms.plan.productId !== productId) throw new Error('Published product differs');
    const stored = await readApplicationPlanProjection(database, terms.plan.id, terms.revisionId, productId);
    const { id, schemaVersion: _, ...draft } = stored.projection.bundle.draft;
    const projected = publishedSubscriptionPlanSchema.parse({ ...draft, revisionId: id });
    // Both objects use the same strict schema/key order; compare all declared commercial terms.
    // Presentation is owner display configuration and is not part of the application projection.
    const { presentation: _presentation, ...commercial } = terms;
    if (JSON.stringify(projected) !== JSON.stringify(publishedSubscriptionPlanSchema.parse(commercial))) throw new Error('Published application projection differs');
  }
}
