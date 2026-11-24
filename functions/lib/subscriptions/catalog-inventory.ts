import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '../supabase';
import type { PagesEnv } from '../types';
import { z } from 'zod';
import { enumOptions } from '../../shared/lib/feature-values';

const text = z.string().min(1).refine(value => value === value.trim());
const plan = z.object({
  id: z.string().uuid(), code: text, productId: z.string().uuid().nullable(), name: text,
  isActive: z.boolean(), applicableEntities: z.array(text).refine(items => new Set(items).size === items.length),
}).strict();
const canonicalCatalog = z.object({ schemaVersion: z.literal(1), plans: z.array(plan) }).strict();
const feature = z.object({
  id: z.string().uuid(), feature_key: text, display_name: text,
  feature_type: z.enum(['boolean', 'numeric_limit', 'metered', 'enum']), category: text,
  value_options: z.array(text).nullable(),
}).strict().superRefine((value, context) => {
  try {
    if (value.feature_type === 'enum') enumOptions(value.value_options);
    else if (value.value_options !== null) throw new Error('Unexpected options');
  } catch { context.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid feature option domain' }); }
});

/** Same owner definition in inventory and both authoring contexts. */
export function applicationFeatureDefinition(item: z.infer<typeof feature>) {
  return { id: item.id, key: item.feature_key, name: item.display_name, type: item.feature_type, category: item.category,
    ...(item.feature_type === 'enum' ? { options: enumOptions(item.value_options) } : {}) };
}

export interface CatalogInventoryBinding {
  getSubscriptionCatalogInventory(): Promise<unknown>;
}

/** Read only this application's explicitly configured owner database. */
export function catalogInventoryDatabase(env: PagesEnv): SupabaseClient {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || url !== url.trim() || !key || key !== key.trim()) throw new Error('Application catalog database is not configured');
  const target = new URL(url);
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || target.search || target.hash) {
    throw new Error('Invalid application catalog database target');
  }
  return createSupabaseAdminClient(env);
}

export async function readApplicationFeatureInventory(database: SupabaseClient) {
  const features: z.infer<typeof feature>[] = [];
  const keys = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < 100; page++) {
    let query = database.from('features').select('id,feature_key,display_name,feature_type,category,value_options')
      .order('id', { ascending: true }).limit(200);
    if (cursor !== undefined) query = query.gt('id', cursor);
    const { data, error } = await query.abortSignal(AbortSignal.timeout(15000));
    if (error) throw new Error('Application feature inventory is unavailable');
    const rows = z.array(feature).max(200).parse(data);
    for (const item of rows) {
      const id = item.id.toLowerCase();
      if ((cursor !== undefined && id <= cursor) || keys.has(item.feature_key)) {
        throw new Error('Application feature inventory is inconsistent');
      }
      keys.add(item.feature_key);
      features.push({ ...item, id });
      cursor = id;
    }
    // A short page can reflect a server row cap, rather than the end of the registry.
    if (rows.length === 0) return features;
  }
  throw new Error('Application feature inventory pagination budget exceeded');
}

/** Transport boundaries remain explicit. Separate owner reads are not an atomic publication. */
export async function loadSubscriptionCatalogInventory(sso: CatalogInventoryBinding, database: SupabaseClient) {
  const [rawCatalog, features] = await Promise.all([
    sso.getSubscriptionCatalogInventory(), readApplicationFeatureInventory(database),
  ]);
  const catalog = canonicalCatalog.parse(rawCatalog);
  const ids = new Set<string>(), codes = new Set<string>();
  for (const item of catalog.plans) {
    const id = item.id.toLowerCase();
    if (ids.has(id) || codes.has(item.code)) throw new Error('Canonical plan inventory is inconsistent');
    ids.add(id); codes.add(item.code);
  }
  return {
    schemaVersion: 1 as const,
    plans: catalog.plans.map(item => ({ ...item, id: item.id.toLowerCase(), productId: item.productId === null ? null : item.productId.toLowerCase() })),
    features: features.map(applicationFeatureDefinition),
  };
}
