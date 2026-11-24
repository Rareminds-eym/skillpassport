import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { readApplicationFeatureInventory } from './catalog-inventory';

const uuid = z.string().uuid().transform(value => value.toLowerCase());
const text = z.string().min(1).refine(value => value === value.trim());
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const audiences = z.array(text).min(1).max(200).refine(items => new Set(items).size === items.length);
// `contract_required` (negotiated "Custom") is accepted only on sales-led offers, display-only; see validatedProjection.
const limit = z.discriminatedUnion('kind', [z.object({ kind: z.literal('finite'), value: integer }).strict(),
z.object({ kind: z.literal('unlimited') }).strict(), z.object({ kind: z.literal('contract_required') }).strict()]);
const grant = z.discriminatedUnion('type', [
  z.object({ key: text, type: z.literal('boolean'), enabled: z.boolean() }).strict(),
  z.object({ key: text, type: z.literal('numeric_limit'), enabled: z.boolean(), limit }).strict(),
  z.object({ key: text, type: z.literal('metered'), enabled: z.boolean(), limit: z.object({ kind: z.literal('allocation_policy') }).strict() }).strict(),
  z.object({ key: text, type: z.literal('enum'), enabled: z.boolean(), value: text.nullable() }).strict(),
]);
const cadence = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('activation') }).strict(), z.object({ kind: z.literal('subscription_period') }).strict(),
  z.object({ kind: z.literal('monthly'), timePolicyId: uuid }).strict(),
]);
const expiry = z.discriminatedUnion('kind', [z.object({ kind: z.literal('subscription_end') }).strict(),
z.object({ kind: z.literal('allocation_period_end') }).strict(),
z.object({ kind: z.literal('after_months'), months: integer.min(1), timePolicyId: uuid }).strict()]);
const rule = z.object({
  id: uuid, featureKey: text, poolKey: text,
  recipient: z.enum(['subscriber', 'organization', 'managed_learner']), audiences,
  quantity: z.discriminatedUnion('kind', [z.object({ kind: z.literal('finite'), value: integer.max(2147483647) }).strict(),
  z.object({ kind: z.literal('contract_required') }).strict()]), cadence, expiry,
  rollover: z.discriminatedUnion('kind', [z.object({ kind: z.literal('none') }).strict(),
  z.object({ kind: z.literal('approved'), approvalId: uuid }).strict()]),
}).strict();
const projectionSchema = z.object({
  schemaVersion: z.literal(1), bundle: z.object({
    schemaVersion: z.literal(1),
    draft: z.object({
      schemaVersion: z.literal(2), id: uuid, plan: z.object({ id: uuid, code: z.string().regex(/^pln_[0-9a-f]{32}$/), productId: uuid }).strict(),
      revisionNumber: integer.min(1), name: text, audiences, purchaseMode: z.enum(['free', 'self_service', 'contact_sales']),
      prices: z.array(z.object({
        id: uuid, currency: text, minorUnit: integer, amountMinor: integer,
        intervalUnit: z.enum(['month', 'year']), intervalCount: integer.min(1), quantityBasis: z.enum(['subscription', 'seat']), audiences
      }).strict()).max(1000),
      features: z.array(grant).max(1000)
    }).strict(),
    includedCredits: z.object({ schemaVersion: z.literal(1), id: uuid, revisionId: uuid, funding: z.literal('included'), rules: z.array(rule).max(1000) }).strict(),
  }).strict(), entitlements: z.array(z.object({
    plan_id: uuid, feature_id: uuid, is_enabled: z.boolean(),
    value_numeric: integer.nullable(), value_text: text.nullable()
  }).strict()).max(1000)
}).strict();
export type ApplicationPlanProjection = z.infer<typeof projectionSchema>;
export interface ApplicationPlanProjectionReceipt { projection: ApplicationPlanProjection; stagedBy: string; stagedAt: string }

/** SSO owns commercial validation and authorization. This owner independently binds its feature IDs and values. */
type FeatureInventory = Awaited<ReturnType<typeof readApplicationFeatureInventory>>;
async function validatedProjection(database: SupabaseClient, value: unknown, productId: string, inventory?: FeatureInventory) {
  productId = uuid.parse(productId);
  let serialized: string | undefined;
  try { serialized = JSON.stringify(value); } catch { throw new Error('Invalid projection encoding'); }
  if (serialized === undefined) throw new Error('Invalid projection encoding');
  if (new TextEncoder().encode(serialized).byteLength > 262144) throw new Error('Projection exceeds storage budget');
  const projection = projectionSchema.parse(value);
  const { draft, includedCredits } = projection.bundle;
  if (draft.purchaseMode === 'free' && draft.prices.length !== 0) throw new Error('Free offer cannot contain checkout prices');
  if (draft.plan.productId !== productId || includedCredits.revisionId !== draft.id) throw new Error('Projection scope differs');
  // Sales-led offers carry no checkout price. Their negotiated terms are display-only until a signed contract resolves them.
  const salesLed = draft.purchaseMode === 'contact_sales' && draft.prices.length === 0;
  const negotiated = draft.features.some(item => item.type === 'numeric_limit' && item.limit.kind === 'contract_required')
    || includedCredits.rules.some(allocation => allocation.quantity.kind === 'contract_required');
  if (negotiated && !salesLed) throw new Error('Unresolved negotiated terms require a sales-led offer');
  const definitions = inventory ?? await readApplicationFeatureInventory(database);
  const features = new Map(definitions.map(item => [item.feature_key, item]));
  const remaining = new Map(projection.entitlements.map(row => [row.feature_id, row]));
  if (remaining.size !== projection.entitlements.length || remaining.size !== draft.features.length
    || new Set(draft.features.map(item => item.key)).size !== draft.features.length) throw new Error('Projection coverage differs');
  for (const item of draft.features) {
    const definition = features.get(item.key);
    const row = definition && remaining.get(definition.id);
    const numeric = item.type === 'numeric_limit' && item.limit.kind === 'finite' ? item.limit.value : null;
    const selected = item.type === 'enum' ? item.value : null;
    // A negotiated limit row is always disabled: an enabled NULL limit would read as unlimited.
    const enabled = item.type === 'numeric_limit' && item.limit.kind === 'contract_required' ? false : item.enabled;
    if (!definition || definition.feature_type !== item.type || !row || row.plan_id !== draft.plan.id
      || row.is_enabled !== enabled || row.value_numeric !== numeric || row.value_text !== selected
      || (item.type === 'enum' && (item.enabled !== (selected !== null)
        || (selected !== null && !definition.value_options?.includes(selected))))) throw new Error('Application feature binding differs');
    remaining.delete(definition.id);
  }
  const scopes = new Set<string>(), ids = new Set<string>();
  for (const allocation of includedCredits.rules) {
    if (ids.has(allocation.id) || !draft.features.some(item => item.key === allocation.featureKey && item.type === 'metered' && item.enabled)
      || allocation.audiences.some(audience => !draft.audiences.includes(audience))
      || (allocation.expiry.kind === 'allocation_period_end' && allocation.cadence.kind === 'activation')) throw new Error('Invalid included allocation');
    ids.add(allocation.id);
    for (const audience of allocation.audiences) {
      const scope = JSON.stringify([allocation.featureKey, allocation.poolKey, audience]);
      if (scopes.has(scope)) throw new Error('Overlapping included allocation');
      scopes.add(scope);
    }
  }
  for (const feature of draft.features.filter(item => item.type === 'metered' && item.enabled)) {
    if (draft.audiences.some(audience => !includedCredits.rules.some(item => item.featureKey === feature.key && item.audiences.includes(audience)))) {
      throw new Error('Missing included allocation');
    }
  }
  return projection;
}
function equal(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right)
    && left.length === right.length && left.every((value, index) => equal(value, right[index]));
  const a = left as Record<string, unknown>, b = right as Record<string, unknown>;
  return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => Object.hasOwn(b, key) && equal(a[key], b[key]));
}
async function receipt(database: SupabaseClient, value: unknown, productId: string, inventory?: FeatureInventory): Promise<ApplicationPlanProjectionReceipt> {
  const input = z.object({ projection: z.unknown(), stagedBy: uuid, stagedAt: z.string().datetime({ offset: true }) }).strict().parse(value);
  return { projection: await validatedProjection(database, input.projection, productId, inventory), stagedBy: input.stagedBy, stagedAt: input.stagedAt };
}
export async function stageApplicationPlanProjection(database: SupabaseClient, value: unknown, productId: string, actorId: string) {
  actorId = uuid.parse(actorId); productId = uuid.parse(productId);
  const projection = await validatedProjection(database, value, productId);
  const { data, error } = await database.rpc('stage_subscription_plan_projection', {
    p_projection: projection, p_product_id: productId, p_actor_id: actorId,
  }).abortSignal(AbortSignal.timeout(15000));
  if (error) throw new Error('Application projection staging is unavailable');
  const stored = await receipt(database, data, productId);
  if (stored.stagedBy !== actorId || !equal(stored.projection, projection)) throw new Error('Application projection acknowledgement differs');
  return stored;
}
export async function readApplicationPlanProjection(database: SupabaseClient, planId: string, revisionId: string, productId: string) {
  planId = uuid.parse(planId); revisionId = uuid.parse(revisionId); productId = uuid.parse(productId);
  const { data, error } = await database.from('subscription_plan_projections').select('projection,staged_by,staged_at')
    .eq('plan_id', planId).eq('revision_id', revisionId).eq('product_id', productId).abortSignal(AbortSignal.timeout(15000)).single();
  if (error || !data) throw new Error('Application projection is unavailable');
  const stored = await receipt(database, { projection: data.projection, stagedBy: data.staged_by, stagedAt: data.staged_at }, productId);
  if (stored.projection.bundle.draft.id !== revisionId || stored.projection.bundle.draft.plan.id !== planId) throw new Error('Application projection read scope differs');
  return stored;
}

/** Verify a catalog page against exact immutable application revisions with one projection read. */
export async function readApplicationPlanProjections(database: SupabaseClient,
  references: readonly { planId: string; revisionId: string }[], productId: string, inventory?: FeatureInventory,
): Promise<ReadonlyMap<string, ApplicationPlanProjectionReceipt>> {
  productId = uuid.parse(productId);
  const requested = z.array(z.object({ planId: uuid, revisionId: uuid }).strict()).max(50).parse(references);
  const expected = new Map(requested.map(item => [item.revisionId, item.planId]));
  if (expected.size !== requested.length || new Set(requested.map(item => item.planId)).size !== requested.length) {
    throw new Error('Duplicate application projection request');
  }
  const result = new Map<string, ApplicationPlanProjectionReceipt>();
  if (!requested.length) return result;
  const { data, error } = await database.from('subscription_plan_projections').select('plan_id,revision_id,product_id,projection,staged_by,staged_at')
    .eq('product_id', productId)
    .or(requested.map(item => `and(plan_id.eq.${item.planId},revision_id.eq.${item.revisionId})`).join(','))
    .limit(requested.length + 1).abortSignal(AbortSignal.timeout(15000));
  if (error || !Array.isArray(data) || data.length !== requested.length) throw new Error('Application projection is unavailable');
  const definitions = inventory ?? await readApplicationFeatureInventory(database);
  for (const raw of data) {
    const row = z.object({ plan_id: uuid, revision_id: uuid, product_id: uuid,
      projection: z.unknown(), staged_by: uuid, staged_at: z.string() }).strict().parse(raw);
    if (row.product_id !== productId || expected.get(row.revision_id) !== row.plan_id || result.has(row.revision_id)) {
      throw new Error('Application projection read scope differs');
    }
    const stored = await receipt(database, { projection: row.projection, stagedBy: row.staged_by, stagedAt: row.staged_at }, productId, definitions);
    const draft = stored.projection.bundle.draft;
    if (draft.id !== row.revision_id || draft.plan.id !== row.plan_id) throw new Error('Application projection read scope differs');
    result.set(draft.id, stored);
  }
  return result;
}
