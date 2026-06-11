/**
 * Functions-side role-category groupings (single source of truth for the
 * Cloudflare Pages Functions runtime).
 *
 * WHY THIS FILE EXISTS (and is not imported from `src/`):
 * The Pages Functions project is compiled/bundled as an isolated TS project
 * (`tsconfig.functions.json` → `"include": ["functions"]`, no `@/*` path alias,
 * `src/` not included) and bundled separately from the Vite app. A cross-tree
 * import from `src/shared/types/generated/roles.ts` would couple the Functions
 * bundle to the frontend tree. Instead, this module MIRRORS the `ROLE_CATEGORIES`
 * constant in `src/shared/types/generated/roles.ts` so the admin role group is
 * declared exactly ONCE for the Functions side and consumed by guards/handlers
 * (eliminating the per-handler inline `['admin','company_admin',...]` literals
 * that are bug §3.4 / §7.1).
 *
 * ⚠️ KEEP IN SYNC with `src/shared/types/generated/roles.ts` ROLE_CATEGORIES.
 *
 * ── P3 FOLLOW-UP (tasks 15–18) ────────────────────────────────────────────
 * This STATIC mirror is a Phase-P2 stand-in. In Phase P3 the app-DB
 * `role_categories` shadow table lands, and category membership will be
 * resolved at RUNTIME (design's `rolesInCategory(env, 'admin')`, ~60s cache)
 * so adding/removing a role to/from a category becomes a DB-only change with
 * no code edit or redeploy (E3.2/E3.3). At that point `requireAdmin` will
 * await the DB-resolved group instead of reading `ROLE_CATEGORIES.admin` here,
 * and this static constant becomes compile-time/UX reference only.
 */

/**
 * Role groupings, mirrored from the app-owned `role_categories` table via
 * `src/shared/types/generated/roles.ts`. Order matches the source.
 */
export const ROLE_CATEGORIES = {
    admin: ['admin', 'company_admin', 'owner', 'school_admin', 'college_admin', 'university_admin'],
    educator: ['educator', 'school_educator', 'college_educator'],
    recruiter: ['recruiter', 'company_admin', 'hr'],
    learner: ['learner'],
    system: ['super_admin', 'rm_admin', 'rm_manager'],
} as const;

/** The set of role-category names (admin | educator | recruiter | learner | system). */
export type RoleCategory = keyof typeof ROLE_CATEGORIES;

/**
 * The canonical ADMIN role group — the SINGLE shared definition consumed by
 * `requireAdmin` (and, in task 11.x, by handlers replacing inline literals).
 */
export const ADMIN_ROLES: readonly string[] = ROLE_CATEGORIES.admin;
