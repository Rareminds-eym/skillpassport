/**
 * Canonical role definitions for the SkillPassport RBAC system.
 *
 * ⚠️ AUTO-GENERATED — DO NOT EDIT BY HAND.
 * Regenerate with: `npm run generate:roles` (scripts/generate-role-types.ts).
 *
 * Source of truth: the app-DB shadow `public.roles` table (synced from the
 * sso-worker) and the app-owned `public.role_categories` table. The generator
 * reads both (READ-ONLY) and emits this file. A CI / pre-commit drift check
 * (task 18.2) re-runs the generator and fails if this file is stale.
 *
 * Ordering is alphabetical for determinism (stable diffs for drift detection);
 * no runtime code depends on the order. Runtime authorization is enforced in
 * Cloudflare Functions from the verified JWT — NOT from these constants. The
 * `ROLE_CATEGORIES` constant is for compile-time type-safety and frontend UX
 * only; runtime category membership is read from `role_categories` so a role's
 * category can change with a DB-only edit.
 */

/**
 * The canonical set of SSO roles, mirrored from the app-DB shadow `roles`
 * table. Used to derive the `UserRole` union.
 */
export const SSO_ROLES = [
    'admin',
    'college_admin',
    'college_educator',
    'company_admin',
    'educator',
    'hr',
    'learner',
    'member',
    'owner',
    'recruiter',
    'rm_admin',
    'rm_manager',
    'school_admin',
    'school_educator',
    'super_admin',
    'university_admin',
] as const;

/**
 * The canonical role type. This is the ONLY place `UserRole` is defined;
 * all other modules re-export or import it (see Phase P1, task 6.2).
 */
export type UserRole = (typeof SSO_ROLES)[number];

/**
 * Role groupings, mirrored from the app-owned `role_categories` table.
 *
 * NOTE: this constant is for COMPILE-TIME type-safety and frontend UX only.
 * Runtime authorization MUST read `role_categories` from the shadow DB so a
 * role's category membership can change with a DB-only edit (E3.2 / E3.3).
 */
export const ROLE_CATEGORIES = {
    admin: ['admin', 'college_admin', 'company_admin', 'owner', 'school_admin', 'university_admin'],
    educator: ['college_educator', 'educator', 'school_educator'],
    learner: ['learner'],
    recruiter: ['company_admin', 'hr', 'recruiter'],
    system: ['rm_admin', 'rm_manager', 'super_admin'],
} as const;

/**
 * The set of role-category names. Derived from `ROLE_CATEGORIES` keys for
 * type-safe category references.
 */
export type RoleCategory = keyof typeof ROLE_CATEGORIES;
