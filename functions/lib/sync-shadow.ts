/**
 * Shadow table sync utilities — keeps subscription_cache and plans_cache
 * in sync with the auth DB source of truth.
 *
 * Write-through: called after every subscription write to auth DB.
 * Self-healing: stale entries trigger async refresh on next read.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const STALENESS_THRESHOLD_MINUTES = 60;

export async function syncSubscriptionCache(
  supabase: SupabaseClient,
  subscription: Record<string, unknown>,
  plan?: Record<string, unknown> | null,
): Promise<void> {
  const { error } = await supabase
    .from('subscription_cache')
    .upsert({
      id: subscription.id,
      user_id: subscription.user_id,
      organization_id: subscription.organization_id || null,
      plan_id: subscription.plan_id,
      plan_code: subscription.plan_code || (plan as Record<string, unknown>)?.plan_code,
      plan_name: subscription.plan_type || (plan as Record<string, unknown>)?.name,
      plan_type: subscription.plan_type,
      plan_amount: subscription.plan_amount,
      billing_cycle: subscription.billing_cycle,
      status: subscription.status,
      features: subscription.features || (plan as Record<string, unknown>)?.base_features || [],
      subscription_start_date: subscription.subscription_start_date,
      subscription_end_date: subscription.subscription_end_date,
      is_organization_subscription: subscription.is_organization_subscription || false,
      organization_type: subscription.organization_type || null,
      seat_count: subscription.seat_count || 1,
      product_id: subscription.product_id || (plan as Record<string, unknown>)?.product_id || null,
      receipt_url: subscription.receipt_url || null,
      synced_at: new Date().toISOString(),
      auth_updated_at: subscription.updated_at,
    }, { onConflict: 'id' });

  if (error) {
    console.error('[sync-shadow] Failed to sync subscription_cache:', error.message);
  }
}

export async function syncPlanCache(
  supabase: SupabaseClient,
  plan: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('plans_cache')
    .upsert({
      id: plan.id,
      plan_code: plan.plan_code,
      name: plan.name,
      business_type: plan.business_type,
      applicable_entities: plan.applicable_entities,
      pricing_matrix: plan.pricing_matrix,
      base_features: plan.base_features,
      entity_config: plan.entity_config,
      display_order: plan.display_order,
      is_active: plan.is_active,
      product_id: plan.product_id || null,
      synced_at: new Date().toISOString(),
      auth_updated_at: plan.updated_at,
    }, { onConflict: 'id' });

  if (error) {
    console.error('[sync-shadow] Failed to sync plans_cache:', error.message);
  }
}

export async function syncAllPlansCache(
  supabase: SupabaseClient,
  plans: Record<string, unknown>[],
): Promise<void> {
  for (const plan of plans) {
    await syncPlanCache(supabase, plan);
  }
}

export function isStale(syncedAt: string | null, thresholdMinutes = STALENESS_THRESHOLD_MINUTES): boolean {
  if (!syncedAt) return true;
  const synced = new Date(syncedAt).getTime();
  const threshold = thresholdMinutes * 60 * 1000;
  return Date.now() - synced > threshold;
}

/**
 * Ensure a user exists in users_shadow (App DB).
 * Must be called before syncSubscriptionCache since subscription_cache
 * has a FK constraint → users_shadow(id).
 */
export async function syncUserShadow(
  supabase: SupabaseClient,
  userId: string,
  email?: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from('users_shadow')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase
      .from('users_shadow')
      .insert({ id: userId, email: email || `${userId}@unknown` });

    if (error) {
      console.error('[sync-shadow] Failed to sync users_shadow:', error.message);
    }
  }
}

// ─── Roles shadow sync (P3, task 16.1) ─────────────────────────
//
// The sso-worker is the SINGLE SOURCE OF TRUTH for authorization roles. The
// app DB keeps only a READ-ONLY shadow (`public.roles`, name-keyed) so the
// type generator (task 18) and reference data (task 17) have a local mirror.
// The shadow is NOT an authorization source — Cloudflare Functions enforce
// authz from the verified JWT (`user.roles`), never from this table.
//
// Like `syncSubscriptionCache`, this is FAIL-SOFT: any failure is logged
// (never thrown) so a sync hiccup can never break a request.

/**
 * A single canonical role as returned by the sso-worker.
 * Mirrors `public.roles` on the sso-worker side
 * (`sso-worker/.../20260526000000_schema.sql`: id uuid, name text,
 * description text, created_at).
 */
interface SsoRole {
  /** sso-worker `roles.id` — stored in the shadow as `sso_role_id` for traceability. */
  id?: string;
  /** Canonical role name — the shadow primary key. */
  name: string;
  description?: string | null;
}

/**
 * The RPC surface this sync expects on the `SSO_SERVICE` Service Binding.
 *
 * NOTE: `listRoles()` is the method named by design.md → "Sync Mechanism"
 * (`ssoService.listRoles()`). It mirrors the existing `syncPlans(): { plans }`
 * RPC on the `SsoWorker` WorkerEntrypoint. As of task 16.1 the sso-worker does
 * NOT yet expose `listRoles()`; it must be added sso-worker-side (returning the
 * canonical 16 roles from its `public.roles` table) and wired into the typed
 * client / triggers in task 16.2. This shape is the contract that task expects.
 */
interface SsoRolesRpc {
  listRoles(): Promise<{ roles: SsoRole[] }>;
}

/** Minimal env shape needed for the roles sync — mirrors `SsoClientEnv` in `sso-client.ts`. */
interface SsoRolesEnv {
  SSO_SERVICE: Fetcher;
}

/** Small summary returned by {@link syncRolesShadow} (used by the reconcile/verify tasks). */
export interface SyncRolesResult {
  /** Number of roles upserted into the shadow. */
  synced: number;
  /** Number of orphan shadow rows pruned (names no longer in the source). */
  deleted: number;
  /** A short, human-readable failure reason, or null on success. */
  error: string | null;
}

/**
 * Sync the read-only `public.roles` shadow from the sso-worker (the source of
 * truth) via the `SSO_SERVICE` Service Binding RPC.
 *
 * Pulls the canonical roles list with `SSO_SERVICE.listRoles()`, upserts each
 * role into `public.roles` (keyed on `name`), and prunes any orphan shadow rows
 * so the shadow EQUALS the canonical set (verified by task 17.3).
 *
 * READ-ONLY SHADOW / NOT AN AUTHZ SOURCE: authorization is decided from the
 * verified JWT in Functions, never from this table. FAIL-SOFT: every failure is
 * logged (`[sync-shadow] ...`) and surfaced in the result — nothing is thrown,
 * so a sync failure can never break a request.
 *
 * @param supabase - App DB service-role client (write access to `public.roles`).
 * @param env      - Pages Functions env carrying the `SSO_SERVICE` binding.
 * @returns A {@link SyncRolesResult} summary (counts + optional error reason).
 */
export async function syncRolesShadow(
  supabase: SupabaseClient,
  env: SsoRolesEnv,
): Promise<SyncRolesResult> {
  const result: SyncRolesResult = { synced: 0, deleted: 0, error: null };

  // 1) Pull canonical roles from the sso-worker via the Service Binding RPC.
  let roles: SsoRole[];
  try {
    if (!env?.SSO_SERVICE) {
      console.error('[sync-shadow] SSO_SERVICE binding not configured; skipping roles sync');
      result.error = 'SSO_SERVICE binding not configured';
      return result;
    }
    const ssoService = env.SSO_SERVICE as unknown as SsoRolesRpc;
    const response = await ssoService.listRoles();
    roles = (response?.roles ?? []) as SsoRole[];
  } catch (err) {
    console.error(
      '[sync-shadow] Failed to fetch roles via SSO_SERVICE.listRoles():',
      err instanceof Error ? err.message : String(err),
    );
    result.error = 'listRoles RPC failed';
    return result;
  }

  // Guard: never reconcile from an empty source (treat as a soft failure) — this
  // prevents an empty/degraded RPC response from wiping the shadow.
  if (roles.length === 0) {
    console.error('[sync-shadow] SSO_SERVICE.listRoles() returned no roles; leaving shadow unchanged');
    result.error = 'no roles returned';
    return result;
  }

  const syncedAt = new Date().toISOString();

  // 2) Upsert each canonical role into the shadow (keyed on name).
  const { error: upsertError } = await supabase
    .from('roles')
    .upsert(
      roles.map((role) => ({
        name: role.name,
        description: role.description ?? null,
        sso_role_id: role.id ?? null,
        synced_at: syncedAt,
      })),
      { onConflict: 'name' },
    );

  if (upsertError) {
    console.error('[sync-shadow] Failed to sync roles shadow:', upsertError.message);
    result.error = upsertError.message;
    return result;
  }
  result.synced = roles.length;

  // 3) Prune orphans so the shadow EQUALS the canonical set (task 17.3). Guarded:
  //    we only reach here after a confirmed non-empty fetch, so this can delete
  //    only names genuinely absent from the source — never the whole table.
  const canonicalList = roles.map((r) => `"${r.name}"`).join(',');
  const { data: deleted, error: deleteError } = await supabase
    .from('roles')
    .delete()
    .not('name', 'in', `(${canonicalList})`)
    .select('name');

  if (deleteError) {
    console.error('[sync-shadow] Failed to prune orphan roles from shadow:', deleteError.message);
    result.error = deleteError.message;
    return result;
  }
  result.deleted = deleted?.length ?? 0;

  return result;
}

/**
 * On-demand (cache-miss) refresh for the read-only `public.roles` shadow.
 *
 * This is the SAFETY NET that complements the primary mechanism (the scheduled
 * reconcile in `functions/api/cron/reconcile-subscriptions.ts`). It is meant to
 * be called from a roles-shadow READER at the point a cache-miss would occur —
 * i.e. when the runtime category resolution (`rolesInCategory(env, 'admin')`,
 * design.md "App-side role-group guard") reads `role_categories`/`roles` and
 * finds the shadow EMPTY or STALE.
 *
 * Behaviour (FAIL-SOFT — never throws, never blocks the request):
 *   1. Read the freshest `synced_at` from the shadow.
 *   2. If the shadow is empty OR the newest row is stale (reuses {@link isStale}
 *      with the shared {@link STALENESS_THRESHOLD_MINUTES}), trigger
 *      {@link syncRolesShadow}.
 *   3. Otherwise no-op (`refreshed: false`).
 *
 * Any error (read failure, RPC failure) is logged and swallowed: a cache-miss
 * refresh must never break the consumer's request. Authorization is ALWAYS
 * decided from the verified JWT in Functions, never from this shadow, so a
 * stale/empty shadow only affects reference reads, not access decisions.
 *
 * WIRING (P3 → P5): the live consumer is the runtime `rolesInCategory` DB
 * resolution described in design.md (task 11.2's `requireAdmin`/`requireRole`
 * group lookup) and the `loadAndCache` path that will read `role_categories`.
 * That DB-resolution is a later refinement (P5 / task 24-era), so this helper is
 * provided now as the reusable cache-miss hook for that reader to call:
 *
 * ```ts
 * // inside loadAndCache(env, category) — when the shadow read returns no rows:
 * await ensureRolesShadowFresh(supabase, env); // best-effort top-up, then re-read
 * ```
 *
 * @param supabase - App DB service-role client (read `roles.synced_at`, write on refresh).
 * @param env      - Pages Functions env carrying the `SSO_SERVICE` binding.
 * @returns `{ refreshed }` — whether a sync was triggered — plus the
 *          {@link SyncRolesResult} when a refresh ran (`result`), else `null`.
 */
export async function ensureRolesShadowFresh(
  supabase: SupabaseClient,
  env: SsoRolesEnv,
  thresholdMinutes = STALENESS_THRESHOLD_MINUTES,
): Promise<{ refreshed: boolean; result: SyncRolesResult | null }> {
  try {
    // Read the freshest shadow row to decide emptiness/staleness.
    const { data, error } = await supabase
      .from('roles')
      .select('synced_at')
      .order('synced_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Treat a read failure as "cannot confirm freshness" — log and skip the
      // refresh rather than risk hammering the source on every miss.
      console.error('[sync-shadow] ensureRolesShadowFresh: shadow read failed:', error.message);
      return { refreshed: false, result: null };
    }

    const empty = !data;
    const stale = empty || isStale((data as { synced_at: string | null }).synced_at, thresholdMinutes);

    if (!stale) {
      return { refreshed: false, result: null };
    }

    // Empty or stale → trigger a best-effort refresh (itself fail-soft).
    const result = await syncRolesShadow(supabase, env);
    return { refreshed: true, result };
  } catch (err) {
    console.error(
      '[sync-shadow] ensureRolesShadowFresh: unexpected error (ignored):',
      err instanceof Error ? err.message : String(err),
    );
    return { refreshed: false, result: null };
  }
}
