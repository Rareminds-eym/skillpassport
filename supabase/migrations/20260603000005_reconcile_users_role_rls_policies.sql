-- =============================================================================
-- Migration: 20260603000005_reconcile_users_role_rls_policies
-- Spec:      rbac-architecture-violations-fix  (Phase P4, task 21.2)
-- Purpose:   Remove the vestigial RLS policies that reference
--            `public.users.role` / the `public.user_role` enum / `auth.jwt()`
--            / `auth.users.raw_user_meta_data`, so that task 22 can DROP the
--            `users.role` column (22.1) and `DROP TYPE public.user_role` (22.2).
--
-- WHY THESE ARE VESTIGIAL (see .kiro/verifications/2026-06-07_p4-rls-assessment.md):
--   * Cloudflare Functions access these tables via the Supabase `service_role`
--     client (`functions/lib/supabase.ts::getServiceClient`), which BYPASSES RLS
--     entirely. RLS therefore gates nothing on the server side (bugfix.md CC-2).
--   * The app authenticates via the SSO worker and NEVER calls `supabase.auth.*`
--     (see steering `no-supabase-auth`). The frontend `supabase` client is a
--     plain ANON client with no session (`src/shared/api/supabaseClient.ts`),
--     so `auth.uid()` is NULL and `auth.jwt()->>'role'` is never an admin/enum
--     value. Every predicate below already evaluates to FALSE for that client.
--   => Dropping these policies is BEHAVIOR-PRESERVING (no behavior change for
--      either service_role Functions or the anon frontend).
--
-- SCOPE / NON-GOALS:
--   * This migration removes RLS policies ONLY.
--   * It does NOT drop `users.role`, does NOT drop the `role_type` enum columns,
--     and does NOT run `DROP TYPE public.user_role` — those are task 22.
--   * Equivalence / vestigial-confirmation tests are added by task 21.3.
--
-- APPLICATION IS APPROVAL-GATED: do not apply until the P4 review approves it.
-- All statements are idempotent (`DROP POLICY IF EXISTS`).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- SECTION 1 (REQUIRED) — Policies referencing the `public.user_role` enum
-- via `public.users.role`. These are the hard blockers for task 22.1 / 22.2:
-- `DROP users.role` and `DROP TYPE public.user_role` will FAIL while these exist.
-- 13 policies across 7 tables. (Live-confirmed in P3 report §3.4.)
-- -----------------------------------------------------------------------------

-- license_assignments (1)
DROP POLICY IF EXISTS "Admins can create license assignments" ON public.license_assignments;

-- license_pools (4)
DROP POLICY IF EXISTS "Admins can create license pools" ON public.license_pools;
DROP POLICY IF EXISTS "Admins can delete license pools" ON public.license_pools;
DROP POLICY IF EXISTS "Admins can update license pools" ON public.license_pools;
DROP POLICY IF EXISTS "Admins can view own organization license pools" ON public.license_pools;

-- class_swap_requests (1)
DROP POLICY IF EXISTS "Admins can manage all swap requests" ON public.class_swap_requests;

-- class_swap_history (1)
DROP POLICY IF EXISTS "Admins can view all swap history" ON public.class_swap_history;

-- external_assessment_attempts (1)
DROP POLICY IF EXISTS "Admins can view all external assessment attempts" ON public.external_assessment_attempts;

-- college_curriculums (4)
DROP POLICY IF EXISTS "College admins can update their curriculum" ON public.college_curriculums;
DROP POLICY IF EXISTS "College admins can view their curriculum" ON public.college_curriculums;
DROP POLICY IF EXISTS "University admins can update curriculum for approval" ON public.college_curriculums;
DROP POLICY IF EXISTS "University admins can view affiliated college curriculum" ON public.college_curriculums;

-- adaptive_question_bank (1)
-- NOTE: the non-role policy "Learners can read active questions" (is_active=true)
-- is intentionally LEFT IN PLACE — only the super_admin gate is removed.
DROP POLICY IF EXISTS "Super admins can manage questions" ON public.adaptive_question_bank;

-- -----------------------------------------------------------------------------
-- SECTION 2 (NAMED IN TASK) — `user_categories` policy using `auth.jwt()`.
-- NOT a 22.x blocker (no enum / no users.role), but explicitly named in task
-- 21.2 and is the same vestigial class (anon JWT is never 'admin').
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage categories" ON public.user_categories;

-- -----------------------------------------------------------------------------
-- SECTION 3 (CONSISTENCY) — Library policies using
-- `auth.users.raw_user_meta_data ->> 'role'`. These reference the Supabase-Auth
-- `auth.users` table (NOT `public.users.role`, NOT the `user_role` enum), so they
-- are NOT 22.x blockers. They are the same vestigial class (depend on a
-- Supabase-Auth session the SSO app never establishes) and are removed here for
-- consistency. If you wish to DEFER these, delete this section — Sections 1 & 2
-- are sufficient to unblock task 22. (See assessment §1 Group C.)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all book issues" ON public.library_book_issues;
DROP POLICY IF EXISTS "Admins can view all book issues" ON public.library_book_issues_college;
DROP POLICY IF EXISTS "Admins can view library settings" ON public.library_settings;
DROP POLICY IF EXISTS "Admins can view library settings" ON public.library_settings_college;
DROP POLICY IF EXISTS "Only admins can manage book issues" ON public.library_book_issues;
DROP POLICY IF EXISTS "Only admins can manage book issues" ON public.library_book_issues_college;
DROP POLICY IF EXISTS "Only admins can manage library books" ON public.library_books_college;
DROP POLICY IF EXISTS "Only admins can manage library categories" ON public.library_categories;
DROP POLICY IF EXISTS "Only admins can manage library categories" ON public.library_categories_college;
DROP POLICY IF EXISTS "Only admins can manage library settings" ON public.library_settings;
DROP POLICY IF EXISTS "Only admins can manage library settings" ON public.library_settings_college;

-- -----------------------------------------------------------------------------
-- SECTION 4 (OPTIONAL / FLAGGED) — Additional `auth.jwt() ->> 'role' = 'admin'`
-- gates discovered during the sweep. NOT named in task 21.2 and NOT 22.x
-- blockers, but identical vestigial class to Section 2. Included so we do not
-- leave 3 identical vestigial policies behind while removing `user_categories`.
-- If you prefer to keep these for now, delete this section. (Assessment §1 Group D.)
--
-- NOT removed (kept on purpose): the `service_role`-allow policies on
-- learner_course_progress / tutor_feedback (`auth.jwt()->>'role' = 'service_role'`)
-- are legitimate allow rules, NOT vestigial admin gates.
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all document access" ON public.document_access_history;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all state history" ON public.user_state_history;

COMMIT;
