import type { ResponseScale } from '../types';

/** Rating sections must define their options explicitly; never infer a scale. */
export function requireResponseScale(value: unknown, sectionName: string): ResponseScale[] {
  const fail = (): never => { throw new Error(`Missing or invalid response scale for section ${sectionName}`); };
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch { return fail(); }
  }
  const scale = Array.isArray(parsed) ? parsed : (parsed as { values?: unknown } | null)?.values;
  if (!Array.isArray(scale) || scale.length < 2) return fail();
  if (!scale.every(option => option && typeof option.value === 'number' && Number.isFinite(option.value) &&
      typeof option.label === 'string' && option.label.trim().length > 0)) return fail();
  if (new Set(scale.map(option => option.value)).size !== scale.length || Math.max(...scale.map(option => option.value)) <= 0) return fail();
  return scale;
}
