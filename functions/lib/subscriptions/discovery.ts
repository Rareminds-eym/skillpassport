import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { applicationFeatureDefinition, catalogInventoryDatabase, readApplicationFeatureInventory } from './catalog-inventory';
import { subscriptionConsumerEndpoint, subscriptionFailure, subscriptionResponseHeaders } from './current-subscription';
import { readApplicationPlanProjections } from './publication';

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

export const publishedSubscriptionCatalogEndpoint = subscriptionConsumerEndpoint('GET', async context => {
  const input = readCursor(context.request);
  if (!input.valid) return subscriptionFailure(400);
  const database = catalogInventoryDatabase(context.env);
  const inventory = await readApplicationFeatureInventory(database);
  const features = inventory.map(item => {
    const { key, type, ...rest } = applicationFeatureDefinition(item);
    return { key, type, ...('options' in rest ? { options: rest.options } : {}) };
  });
  const raw = await context.env.SSO_SERVICE!.listPublishedSubscriptionPlans(context.token, context.productId, features, input.cursor);
  if (z.object({ kind: z.literal('forbidden') }).strict().safeParse(raw).success) return subscriptionFailure(403);
  const page = catalog.parse(raw);
  pageScope(context.actorId, context.productId, page, input.cursor, page.plans.map(item => item.plan.id));
  await verifyPublishedTermsAgainstProjections(database, page.plans, context.productId, inventory);
  return Response.json(page, { headers: subscriptionResponseHeaders });
});

/** Every surface shows terms the application independently stored for the same revision (single catalog source). */
export async function verifyPublishedTermsAgainstProjections(database: SupabaseClient, plans: readonly z.infer<typeof listedPlanSchema>[], productId: string,
  inventory?: Awaited<ReturnType<typeof readApplicationFeatureInventory>>) {
  if (!plans.length) return;
  if (plans.some(terms => terms.plan.productId !== productId)) throw new Error('Published product differs');
  const projections = await readApplicationPlanProjections(database,
    plans.map(terms => ({ planId: terms.plan.id, revisionId: terms.revisionId })), productId, inventory);
  for (const terms of plans) {
    const stored = projections.get(terms.revisionId)!;
    const { id, schemaVersion: _, ...draft } = stored.projection.bundle.draft;
    const projected = publishedSubscriptionPlanSchema.parse({ ...draft, revisionId: id });
    // Both objects use the same strict schema/key order; compare all declared commercial terms.
    // Presentation is owner display configuration and is not part of the application projection.
    const { presentation: _presentation, ...commercial } = terms;
    if (JSON.stringify(projected) !== JSON.stringify(publishedSubscriptionPlanSchema.parse(commercial))) throw new Error('Published application projection differs');
  }
}
