/** Both catalogue codes use the existing free-tier locks; keep stored codes unchanged. */
export function isFreemiumPlan(planCode?: string | null): boolean {
  return ['freemium', 'discover'].includes(planCode?.trim().toLowerCase() || '');
}
