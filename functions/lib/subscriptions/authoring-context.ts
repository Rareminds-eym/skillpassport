import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { applicationFeatureDefinition, readApplicationFeatureInventory } from './catalog-inventory';

const text = z.string().min(1).refine(value => value.trim() === value);
const uniqueText = z.array(text).min(1).refine(values => new Set(values).size === values.length);
export const planAuthoringContextSchema = z.object({
  schemaVersion: z.literal(1),
  plan: z.object({ id: z.string().uuid(), code: z.string().regex(/^pln_[0-9a-f]{32}$/), productId: z.string().uuid() }).strict(),
  audiences: uniqueText,
  currencies: z.array(z.object({ code: z.string().regex(/^[A-Z]{3}$/), minorUnit: z.number().int().nonnegative().safe() }).strict())
    .min(1).refine(values => new Set(values.map(value => value.code)).size === values.length),
}).strict();

export interface PlanAuthoringContextBinding {
  getSubscriptionPlanAuthoringContext(planId: string): Promise<unknown>;
}

/** Owner reads are validated independently; this is neither a publication nor a writable registry. */
export async function loadPlanAuthoringContext(sso: PlanAuthoringContextBinding, database: SupabaseClient, planId: string, productId: string) {
  const id = z.string().uuid().parse(planId).toLowerCase();
  const product = z.string().uuid().parse(productId).toLowerCase();
  const settings = planAuthoringContextSchema.parse(await sso.getSubscriptionPlanAuthoringContext(id));
  if (settings.plan.id.toLowerCase() !== id) throw new Error('Authoring context does not match requested plan');
  if (settings.plan.productId.toLowerCase() !== product) throw new Error('Authoring context belongs to another product');
  const features = await readApplicationFeatureInventory(database);
  return {
    ...settings,
    plan: { ...settings.plan, id, productId: settings.plan.productId.toLowerCase() },
    features: features.map(applicationFeatureDefinition),
  };
}
