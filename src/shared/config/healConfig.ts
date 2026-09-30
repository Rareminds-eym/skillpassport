// KEEP IN SYNC with functions/lib/healConfig.ts — duplicate for boundary rule §8 (no cross-boundary imports)
// Frontend adapter — same shape, Vite env fallback instead of Flagship binding when not available

export type HealFlagKey =
  | 'heal-user'
  | 'subscription-cache-heal'
  | 'cron-reconcile-heal'
  | 'resilience-breaker'
  | 'ws-reconnect-heal';

export function isHealEnabledSync(
  env: Record<string, unknown>,
  key: HealFlagKey,
  defaultValue = true,
): boolean {
  const rawCats = env.HEAL_CATEGORIES as string | undefined;
  if (rawCats) {
    try {
      const cats = JSON.parse(rawCats) as Record<string, string>;
      if (cats[key] === 'disabled') return false;
      if (cats[key] === 'enabled') return true;
      if (cats[key] === 'log-only') return true;
    } catch {}
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

// Frontend Vite env fallback when no Flagship browser SDK
export function isHealEnabledFromVite(key: HealFlagKey, defaultValue = true): boolean {
  const viteEnv: Record<string, unknown> = {
    HEAL_MODE: (import.meta as unknown as { env: Record<string, string> }).env?.VITE_HEAL_MODE,
    HEAL_CATEGORIES: (import.meta as unknown as { env: Record<string, string> }).env?.VITE_HEAL_CATEGORIES,
  };
  return isHealEnabledSync(viteEnv, key, defaultValue);
}

// Async variant for future Flagship browser SDK — currently sync Vite fallback
export async function isHealEnabled(
  env: Record<string, unknown>,
  key: HealFlagKey,
  defaultValue = true,
): Promise<boolean> {
  // Try Flagship FLAGS binding if present (e.g., Pages Functions context)
  const flagsBinding = (env as Record<string, unknown>).FLAGS;
  if (flagsBinding && typeof (flagsBinding as Record<string, unknown>).getBooleanValue === 'function') {
    try {
      const val = await (flagsBinding as { getBooleanValue: (k: string, d: boolean) => Promise<boolean> }).getBooleanValue(key, defaultValue);
      return val;
    } catch {
      return isHealEnabledSync(env, key, defaultValue);
    }
  }
  return isHealEnabledSync(env, key, defaultValue);
}
