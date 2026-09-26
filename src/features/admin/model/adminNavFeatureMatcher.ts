import type { AdminNavFeature } from './useAdminNavFeatures';

/**
 * Resolves which AdminNavFeature gates a given pathname.
 *
 * Implements a strict two-phase matching algorithm to eliminate false positives:
 * 1. Exact path match has absolute precedence.
 *    For example: `/university-admin/examinations/grades` maps directly to `grade_calculation`,
 *    preventing parent route `/university-admin/examinations` (`examination_scheduling`)
 *    from falsely blocking access when an organization licenses only the sub-feature.
 * 2. Longest prefix match fallback for deep nested sub-routes (e.g. `/.../mapping/edit/123`),
 *    guaranteeing that the most specific catalog item governs the route.
 */
export function matchAdminNavFeature(
  pathname: string,
  navFeatures: AdminNavFeature[]
): AdminNavFeature | null {
  if (!pathname || !navFeatures || navFeatures.length === 0) return null;

  const normalizedPath = pathname.replace(/\/+$/, '');

  // Phase 1: Exact match takes priority
  const exactMatch = navFeatures.find((f: AdminNavFeature) => {
    const fPath = (f.nav_path || '').replace(/\/+$/, '');
    return Boolean(fPath && normalizedPath === fPath);
  });

  if (exactMatch) {
    return exactMatch;
  }

  // Phase 2: Longest prefix match fallback for nested sub-routes
  const prefixMatches = navFeatures
    .filter((f: AdminNavFeature) => {
      const fPath = (f.nav_path || '').replace(/\/+$/, '');
      return Boolean(fPath && normalizedPath.startsWith(fPath + '/'));
    })
    .sort((a: AdminNavFeature, b: AdminNavFeature) => (b.nav_path?.length || 0) - (a.nav_path?.length || 0));

  return prefixMatches[0] || null;
}
