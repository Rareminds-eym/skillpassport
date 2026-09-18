/**
 * Heal Config — Feature flag adapter for self-healing toggles
 *
 * Industrial-grade 2026 pattern:
 * - Primary: Cloudflare Flagship Worker binding (env.FLAGS) via OpenFeature,
 *   sub-ms edge eval, KV+DO backed, typed values, audit trail.
 * - Fallback: env.HEAL_MODE / env.HEAL_CATEGORIES env-vars when Flagship
 *   not provisioned (beta) or KV unavailable. Safe default = enabled (heal on).
 *
 * 6 flags (self-healing only, false positives excluded):
 *  heal-user, subscription-cache-heal, cron-reconcile-heal,
 *  resilience-breaker, ws-reconnect-heal
 *  (assessment-session-swap removed — bug, not heal)
 *
 * Safe defaults: all true (heal enabled). When Flagship returns error or
 * flag undefined, heal stays enabled to preserve current prod behavior.
 *
 * Usage:
 *   import { isHealEnabled } from './healConfig';
 *   if (!await isHealEnabled(env, 'heal-user')) { metric heal_disabled; return {healed:false,reason:'flag_disabled'}; }
 */

export type HealFlagKey =
  | 'heal-user'
  | 'subscription-cache-heal'
  | 'cron-reconcile-heal'
  | 'resilience-breaker'
  | 'ws-reconnect-heal';

export type HealMode = 'enabled' | 'disabled' | 'log-only';

export interface HealCategoriesEnv {
  HEAL_MODE?: string;
  HEAL_CATEGORIES?: string; // JSON string: {"heal-user":"disabled"}
  FLAGS?: unknown; // Flagship binding
}

// KEEP IN SYNC with src/shared/config/healConfig.ts — duplicate for boundary rule §8

/**
 * Resolves heal enabled via env fallback (synchronous, no Flagship).
 * Used as fast-path when Flagship binding absent and for resilience breaker sync path.
 */
export function isHealEnabledSync(
  env: Record<string, unknown>,
  key: HealFlagKey,
  defaultValue = true,
): boolean {
  // Per-category JSON override takes precedence
  const rawCats = env.HEAL_CATEGORIES as string | undefined;
  if (rawCats) {
    try {
      const cats = JSON.parse(rawCats) as Record<string, string>;
      if (cats[key] === 'disabled') return false;
      if (cats[key] === 'enabled') return true;
      if (cats[key] === 'log-only') return true; // log-only = enabled but metric
    } catch {
      // Invalid JSON — ignore, fall through to global
    }
  }
  const global = env.HEAL_MODE as string | undefined;
  if (global === 'disabled') return false;
  if (global === 'log-only') return true;
  if (global === 'enabled') return true;
  return defaultValue;
}

export function isHealLogOnly(env: Record<string, unknown>, key: HealFlagKey): boolean {
  const rawCats = env.HEAL_CATEGORIES as string | undefined;
  if (rawCats) {
    try {
      const cats = JSON.parse(rawCats) as Record<string, string>;
      if (cats[key] === 'log-only') return true;
    } catch {}
  }
  return (env.HEAL_MODE as string) === 'log-only';
}

/**
 * Async flag eval via Flagship binding when available.
 * Falls back to sync env var when Flagship not provisioned or evaluation fails.
 * Must be awaited on request path; for hot sync path use isHealEnabledSync.
 */
export async function isHealEnabled(
  env: Record<string, unknown>,
  key: HealFlagKey,
  defaultValue = true,
): Promise<boolean> {
  const flagsBinding = (env as Record<string, unknown>).FLAGS;
  if (flagsBinding && typeof (flagsBinding as Record<string, unknown>).getBooleanValue === 'function') {
    try {
      const val = await (flagsBinding as { getBooleanValue: (k: string, d: boolean) => Promise<boolean> }).getBooleanValue(key, defaultValue);
      // Env explicit disabled overrides Flagship enabled (emergency kill-switch without dashboard)
      const rawCats = env.HEAL_CATEGORIES as string | undefined;
      const global = env.HEAL_MODE as string | undefined;
      let envSaysDisabled = false;
      if (rawCats) {
        try {
          const cats = JSON.parse(rawCats) as Record<string, string>;
          if (cats[key] === 'disabled') envSaysDisabled = true;
        } catch {}
      } else if (global === 'disabled') {
        envSaysDisabled = true;
      }
      if (envSaysDisabled) return false;
      return val;
    } catch {
      // Flagship eval failed — fall back to env
      return isHealEnabledSync(env, key, defaultValue);
    }
  }
  // No Flagship binding — use env vars
  return isHealEnabledSync(env, key, defaultValue);
}

export async function shouldLogHealDisabled(env: Record<string, unknown>, key: HealFlagKey): Promise<boolean> {
  // Emit heal_disabled metric when flag would have healed but is disabled
  const enabled = await isHealEnabled(env, key);
  return !enabled;
}
