/**
 * Program dropdown label helpers.
 *
 * Shows "Program Name - Spec1, Spec2" when specializations exist,
 * otherwise just "Program Name".
 *
 * Accepts the DB shape (`text[]`), a legacy comma-separated string,
 * null, or undefined — so dropdowns keep working even when the
 * `specializations` column hasn't been backfilled yet.
 */

export function getProgramSpecializations(source: unknown): string[] {
  const specs = (source as { specializations?: unknown } | null | undefined)?.specializations;
  if (Array.isArray(specs)) {
    return specs.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof specs === 'string') {
    return specs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** Dropdown label: "Program Name" when it has no specializations,
 * "CODE - Spec1, Spec2" when it does (falls back to the name if code is missing). */
export function formatProgramLabel(name: string, source: unknown): string {
  const specs = getProgramSpecializations(source);
  if (specs.length === 0) return name;
  const code = (source as { code?: unknown } | null | undefined)?.code;
  const prefix =
    typeof code === 'string' && code.trim().length > 0 ? code.trim() : name;
  return `${prefix} - ${specs.join(', ')}`;
}

/** Suffix for labels that already show extra info: "" or " - Spec1, Spec2". */
export function formatProgramLabelSuffix(source: unknown): string {
  const specs = getProgramSpecializations(source);
  return specs.length > 0 ? ` - ${specs.join(', ')}` : '';
}
