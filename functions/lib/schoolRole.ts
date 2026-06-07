/**
 * School-internal role resolution — data-access seam (task 19.1).
 *
 * WHAT THIS IS
 * ------------
 * The kept college/school permission lookup
 * (`college_role_module_permissions.role_type` join in `user/handlers/actions.ts`
 * `get-permissions`, plus the school-internal scoping reads in
 * `educator/dashboard/[[path]].ts`, `messaging/actions.ts`,
 * `school-admin/actions.ts`) currently resolves a user's SCHOOL-INTERNAL role
 * from `users.role`. After P4 drops `users.role`, that role must come from
 * somewhere else. Per the decision record
 * (`.kiro/plans/2026-06-07_school-role-mapping-decision.md`), the chosen source
 * is the EXISTING `school_educators` record — NOT a new `user_school_role` table.
 *
 * SCHOOL-INTERNAL ≠ SSO ROLE (Property 7 / FC-10)
 * ------------------------------------------------
 * `SchoolInternalRoleCode` (principal, it_admin, class_teacher, …) is a SEPARATE
 * taxonomy from the 16 SSO authorization roles. This helper performs a
 * school-FEATURE-PERMISSION read, NOT an authorization decision. Authorization
 * still derives ONLY from the verified JWT (`requireRole`/`requireAdmin`). SSO
 * roles that are ALSO valid permission `role_code`s (e.g. `school_admin`,
 * `college_admin`, `college_educator`, `school_educator`) are resolved straight
 * from `JWT.roles` by `resolveSchoolRole` (task 19.2) BEFORE this helper is
 * consulted — so this module only covers the genuinely school-internal
 * sub-roles.
 *
 * SEAM, NOT THE FULL FUNCTION
 * ---------------------------
 * This is the data-access seam (step 3 of design clause 8.5). Task 19.2 composes
 * the full `resolveSchoolRole(userId, orgId)`:
 *   1. ssoRoles ← JWT.roles
 *   2. if an SSO role maps to a permission role_code → use it (no DB read)
 *   3. else → lookupSchoolInternalRole(...)   ← THIS MODULE
 *   4. query college_role_module_permissions by role_code
 *
 * NOT wired into any handler yet (that is task 12.2).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthUser } from './auth';

/**
 * Functions-side mirror of the school-internal role taxonomy.
 *
 * ⚠️ KEEP IN SYNC with `src/shared/types/permissions.ts` `SchoolInternalRole`.
 *
 * The Pages Functions project is compiled as an isolated TS project
 * (`tsconfig.functions.json`, no `@/*` alias, `src/` excluded) and cannot import
 * from `src/` (established in task 10.1), so the union is mirrored here — the
 * same pattern as `functions/lib/roleCategories.ts` mirroring `ROLE_CATEGORIES`.
 *
 * NOTE on coverage: the app DB `school_educators.role` CHECK currently allows
 * only a SUBSET of these (`school_admin`, `principal`, `it_admin`,
 * `class_teacher`, `subject_teacher`). The remaining codes are part of the
 * taxonomy but are not yet storable in `school_educators`; see the decision
 * record's "Gaps" section.
 */
export const SCHOOL_INTERNAL_ROLE_CODES = [
    'principal',
    'vice_principal',
    'it_admin',
    'class_teacher',
    'subject_teacher',
    'accountant',
    'librarian',
    'parent',
    'career_counselor',
    'school_admin',
] as const;

export type SchoolInternalRoleCode = (typeof SCHOOL_INTERNAL_ROLE_CODES)[number];

/** Type guard: is the given string a known school-internal role code? */
export function isSchoolInternalRoleCode(value: unknown): value is SchoolInternalRoleCode {
    return typeof value === 'string' && (SCHOOL_INTERNAL_ROLE_CODES as readonly string[]).includes(value);
}

export interface LookupSchoolRoleOptions {
    /**
     * Organization id to scope the lookup to a single school. Because
     * `school_educators.school_id` FKs to `organizations(id)`, for schools
     * `orgId === school_id`. STRONGLY recommended for multi-school users to avoid
     * ambiguity. When omitted, the first matching active record is used.
     */
    orgId?: string | null;
    /**
     * User email — enables the best-effort `teachers`-by-email fallback (the
     * `teachers` table is keyed by email, not user_id). Optional; when absent the
     * fallback is skipped.
     */
    email?: string | null;
}

/**
 * Resolve a user's SCHOOL-INTERNAL role code from the existing
 * `school_educators` record (chosen source per the decision record), with a
 * best-effort `teachers`-by-email fallback.
 *
 * Returns the role code (e.g. `'principal'`, `'class_teacher'`) or `null` when
 * no school-internal assignment can be found. Does NOT default to
 * `subject_teacher` — the caller decides any default (the legacy frontend
 * `subject_teacher` default is being removed in task 13.1).
 *
 * Resolution order (design clause 8.5, step 3):
 *   1. `school_educators` by `user_id` (scoped to `school_id = orgId` when given).
 *   2. best-effort `teachers` by `email` (phantom table — fails soft to null).
 *   3. `null`.
 *
 * This helper FAILS SOFT: any DB error (including the phantom `teachers` table
 * erroring) resolves to `null` rather than throwing, because a missing
 * school-internal role must never block a request — authorization is enforced
 * separately from the JWT (CC-2). It performs NO authorization decision.
 *
 * @param supabase service-role client (caller already authenticated via withAuth)
 * @param userId   the user's id (`users.id` / JWT `sub`)
 * @param opts     optional org scoping + email for the fallback
 */
export async function lookupSchoolInternalRole(
    supabase: SupabaseClient,
    userId: string,
    opts: LookupSchoolRoleOptions = {}
): Promise<SchoolInternalRoleCode | null> {
    const { orgId, email } = opts;

    // 1) Primary source: school_educators, keyed by user_id, scoped by school_id.
    try {
        let query = supabase
            .from('school_educators')
            .select('role, school_id, account_status')
            .eq('user_id', userId);

        if (orgId) {
            query = query.eq('school_id', orgId);
        }

        const { data, error } = await query;

        if (error) {
            console.warn('[schoolRole] school_educators lookup failed:', {
                userId, orgId: orgId ?? null, error: error.message,
            });
        } else if (data && data.length > 0) {
            // Prefer active records; when orgId was omitted and several remain, take
            // the first and log the ambiguity (callers SHOULD pass orgId).
            const active = data.filter((r: any) => r.account_status !== 'inactive');
            const candidates = active.length > 0 ? active : data;

            if (!orgId && candidates.length > 1) {
                console.warn('[schoolRole] multiple school_educators rows; pass orgId to disambiguate:', {
                    userId, count: candidates.length,
                });
            }

            const role = candidates[0]?.role;
            if (isSchoolInternalRoleCode(role)) {
                return role;
            }
        }
    } catch (e) {
        console.warn('[schoolRole] school_educators lookup threw:', {
            userId, error: e instanceof Error ? e.message : String(e),
        });
    }

    // 2) Best-effort fallback: teachers by email. The `teachers` table has no
    // CREATE TABLE in the app schema (phantom — see decision record §2.2), so this
    // query may error or return nothing. Fail soft to null; never throw.
    if (email) {
        try {
            const { data, error } = await supabase
                .from('teachers')
                .select('role')
                .eq('email', email)
                .maybeSingle();

            if (!error && isSchoolInternalRoleCode(data?.role)) {
                return data!.role as SchoolInternalRoleCode;
            }
        } catch (e) {
            // Phantom table / runtime error — expected; swallow and return null.
            console.warn('[schoolRole] teachers fallback unavailable:', {
                email, error: e instanceof Error ? e.message : String(e),
            });
        }
    }

    // 3) No school-internal assignment found.
    return null;
}

// ════════════════════════════════════════════════════════════════════════════
// resolveSchoolRole — full composition (task 19.2, design clause 8.5)
// ════════════════════════════════════════════════════════════════════════════

/**
 * SSO roles that ARE ALSO valid permission `role_code`s.
 *
 * The kept college/school permission lookup matches a single role string against
 * `college_role_module_permissions.role_type` (today typed `public.user_role`;
 * re-typed to `role_code TEXT` in task 20). These four SSO roles double as
 * permission role_codes, so when a user already carries one in their verified
 * JWT `roles[]`, the permission row can be resolved DIRECTLY from the token with
 * NO database read (design clause 8.5, step 2).
 *
 * EVIDENCE for this set:
 *  - `college_role_module_permissions.role_type` is `public.user_role`
 *    (`supabase/migrations/20260526000000_schema.sql:13521`). The enum's
 *    school/college members are `school_admin`, `college_admin`,
 *    `college_educator`, `school_educator` (plus `school_student` /
 *    `college_student`, which are DEPRECATED+unused per the enum's own COMMENT,
 *    and the org-admin tiers `super_admin`/`rm_admin`/`university_admin`/
 *    `company_admin`/`recruiter`/`learner` which are not school/college-feature
 *    permission roles).
 *  - The decision record (`.kiro/plans/2026-06-07_school-role-mapping-decision.md`
 *    §2.3) names exactly these four as the SSO roles that serve as `role_type`.
 *  - `get-permissions` (`functions/api/user/handlers/actions.ts`) and
 *    `settings/[[path]].ts` both treat `role_type` as the lookup key without
 *    further constraint, so any seeded `role_type` value matches — these four
 *    are the school/college-feature codes we can confirm WITHOUT a DB read.
 *
 * PRECEDENCE: ordered most-privileged → least. When a user holds several of
 * these roles, the FIRST match in this list wins, so admin-level codes are
 * preferred over educator-level codes (a school/college admin should not be
 * resolved down to an educator's permission set). The order is deterministic
 * (array order), so resolution is stable regardless of JWT `roles[]` ordering.
 *
 * UNCERTAINTY FLAG: the exhaustive set of `role_type` values actually SEEDED in
 * `college_role_module_permissions` cannot be enumerated here without a DB read
 * (out of scope for this task — no Supabase command is run). If the seed data
 * uses additional `role_type` values (e.g. an org-admin tier), step 3's
 * `school_educators` lookup will not cover them; widening this list (or the
 * seed) would be a separate, evidence-backed change. The four below are the
 * unambiguously-correct school/college-feature permission codes.
 */
export const PERMISSION_ROLE_CODE_PRECEDENCE = [
    'college_admin',
    'school_admin',
    'college_educator',
    'school_educator',
] as const;

export type PermissionRoleCode = (typeof PERMISSION_ROLE_CODE_PRECEDENCE)[number];

/**
 * Pick the highest-precedence SSO-role-that-is-also-a-permission-role_code from a
 * set of verified JWT roles, or `null` when none of them is a permission code.
 *
 * Pure function (no I/O) — exported for unit testing and reuse.
 */
export function pickPermissionRoleFromJwt(jwtRoles: readonly string[] | null | undefined): PermissionRoleCode | null {
    if (!jwtRoles || jwtRoles.length === 0) return null;
    const held = new Set(jwtRoles);
    for (const code of PERMISSION_ROLE_CODE_PRECEDENCE) {
        if (held.has(code)) return code;
    }
    return null;
}

/**
 * Resolve the permission `role_code` to use for the kept college/school
 * permission lookup (`college_role_module_permissions.role_type` join), per
 * design clause 8.5.
 *
 * ⚠️ NOT AN AUTHORIZATION DECISION (Property 7 / FC-10).
 * ----------------------------------------------------
 * This resolves which school-FEATURE-PERMISSION set applies; it does NOT grant
 * access. Authorization is enforced separately and ONLY from the verified JWT
 * (`requireRole`/`requireAdmin` guards). A `null` result means "no
 * feature-permission role found" — the caller decides the default behaviour
 * (e.g. empty permissions); it MUST NOT be treated as a denial or an escalation,
 * and there is NO `subject_teacher` default here.
 *
 * COMPOSITION (clause 8.5):
 *   1. ssoRoles ← user's verified JWT `roles[]`.
 *   2. If any SSO role is itself a permission role_code
 *      (`PERMISSION_ROLE_CODE_PRECEDENCE`), return the highest-precedence match
 *      DIRECTLY — NO database read.
 *   3. Otherwise call `lookupSchoolInternalRole` (the task-19.1 seam) to read the
 *      genuinely school-internal sub-role (`principal`, `it_admin`,
 *      `class_teacher`, …) from `school_educators`.
 *   4. Return `null` if neither yields a role. (Callers then query
 *      `college_role_module_permissions` by the returned role_code.)
 *
 * SIGNATURE RATIONALE: takes the full `AuthUser` (exactly what task 12.2's call
 * sites already have from `getContextUser(context)`), so a call site reads:
 *   `const roleCode = await resolveSchoolRole(supabase, getContextUser(context));`
 * `opts` lets a caller override the org scope / email used for step 3; when
 * omitted they default to the user's own `org_id` / `email` (for schools,
 * `org_id === school_educators.school_id`, per the decision record §2.1).
 *
 * @param supabase service-role client (caller already authenticated via withAuth)
 * @param user     the authenticated user from `getContextUser(context)`
 * @param opts     optional overrides for the step-3 school_educators scoping
 * @returns the resolved permission role_code, or `null`
 */
export async function resolveSchoolRole(
    supabase: SupabaseClient,
    user: AuthUser,
    opts: LookupSchoolRoleOptions = {}
): Promise<string | null> {
    // Steps 1–2: SSO role that is itself a permission role_code → use directly.
    const fromJwt = pickPermissionRoleFromJwt(user?.roles);
    if (fromJwt) {
        return fromJwt;
    }

    // Step 3: genuinely school-internal sub-role from school_educators (seam 19.1).
    // Default the org scope / email to the user's own when the caller did not
    // override them. For schools, org_id === school_educators.school_id.
    const orgId = opts.orgId !== undefined ? opts.orgId : (user?.org_id ?? null);
    const email = opts.email !== undefined ? opts.email : (user?.email ?? null);

    const internalRole = await lookupSchoolInternalRole(supabase, user.id, { orgId, email });

    // Step 4: null when neither path yields a role — caller decides the default.
    return internalRole;
}
