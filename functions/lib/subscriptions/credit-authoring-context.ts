import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { planAuthoringContextSchema } from './authoring-context';
import { applicationFeatureDefinition, readApplicationFeatureInventory } from './catalog-inventory';

const text = z.string().min(1).refine(value => value.trim() === value);
const audiences = z.array(text).min(1).refine(values => new Set(values).size === values.length);
const timeZone = text.refine(value => {
  if (!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+.-]+)*$/.test(value)) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(0); return true; }
  catch { return false; }
});
const context = planAuthoringContextSchema.extend({
  credit: z.object({
    schemaVersion: z.literal(1),
    pools: z.array(z.object({ key: text, featureKey: text, recipient: z.enum(['subscriber', 'organization', 'managed_learner']), audiences }).strict())
      .refine(values => new Set(values.map(value => value.key)).size === values.length),
    timePolicies: z.array(z.object({ id: z.string().uuid().transform(value => value.toLowerCase()), timeZone,
      monthlyAnchor: z.enum(['subscription_anniversary', 'calendar_month_start']), monthDayOverflow: z.enum(['clamp', 'reject']),
      ambiguousTime: z.enum(['earlier', 'later', 'reject']), nonexistentTime: z.enum(['reject', 'shift_forward']) }).strict())
      .refine(values => new Set(values.map(value => value.id)).size === values.length),
  }).strict(),
}).strict();

export interface CreditAuthoringContextBinding {
  getSubscriptionCreditAuthoringContext(planId: string): Promise<unknown>;
}

/** Validates SSO scope before app IO and checks every pool against app-owned feature types. */
export async function loadCreditAuthoringContext(sso: CreditAuthoringContextBinding, database: SupabaseClient, planId: string, productId: string) {
  const id = z.string().uuid().parse(planId).toLowerCase();
  const product = z.string().uuid().parse(productId).toLowerCase();
  const settings = context.parse(await sso.getSubscriptionCreditAuthoringContext(id));
  if (settings.plan.id.toLowerCase() !== id) throw new Error('Credit context does not match requested plan');
  if (settings.plan.productId.toLowerCase() !== product) throw new Error('Credit context belongs to another product');
  if (settings.credit.pools.some(pool => pool.audiences.some(audience => !settings.audiences.includes(audience)))) {
    throw new Error('Credit pool is outside canonical audience scope');
  }
  const features = await readApplicationFeatureInventory(database);
  const types = new Map(features.map(feature => [feature.feature_key, feature.feature_type]));
  if (settings.credit.pools.some(pool => types.get(pool.featureKey) !== 'metered')) {
    throw new Error('Credit pool requires an app-owned metered feature');
  }
  return { ...settings, plan: { ...settings.plan, id, productId: product },
    features: features.map(applicationFeatureDefinition) };
}
