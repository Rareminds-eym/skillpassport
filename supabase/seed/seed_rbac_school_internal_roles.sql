-- Seed: school_internal_roles for the 10 canonical SchoolInternalRole codes
-- Spec: rbac-architecture-violations-fix  |  Phase: P3  |  Task: 17.2
--
-- WHAT / WHY
--   Seeds the app-owned `public.school_internal_roles` lookup table (DDL created by
--   migration 20260603000002_create_school_internal_roles.sql, task 15.4) with the
--   canonical SCHOOL-INTERNAL role codes — the `SchoolInternalRole` taxonomy. The code
--   set below mirrors EXACTLY the single source(s) of truth:
--     - src/shared/types/permissions.ts        `SchoolInternalRole` union (frontend), and
--     - functions/lib/schoolRole.ts             `SCHOOL_INTERNAL_ROLE_CODES` (Functions mirror).
--   Both list the same 10 codes; keep this seed in sync with them.
--
--   `school_internal_roles` is NOT an authorization source. Cloudflare Functions enforce
--   authz from the verified JWT; this lookup only SCOPES school feature permissions and is
--   the FK target for the P4 re-typing (task 20.1 adds
--   `role_code TEXT REFERENCES school_internal_roles(code)` to the college permission tables).
--
--   NOTE on `school_admin`: it appears in BOTH the SSO role set (seeded into `public.roles`
--   by task 17.1) AND this SchoolInternalRole taxonomy. These are DIFFERENT, independent
--   taxonomies (per the task-19.1 decision record / design), so `school_admin` legitimately
--   lives in both — it is included here because `SchoolInternalRole` lists it.
--
--   ── TAXONOMY DISTINCTION (task 20.3) ───────────────────────────────────────────────
--   `school_internal_roles` is the FK target for the P4 `role_code` column on the college
--   permission tables, so it must enumerate the FULL "permission role_code DOMAIN" — i.e.
--   EVERY value that can KEY a `college_role_module_permissions` / `college_role_scope_rules`
--   row. That domain is a SUPERSET of the genuinely-school-internal `SchoolInternalRole`
--   taxonomy:
--
--       permission role_code domain  ⊇  SchoolInternalRole taxonomy
--
--   The producers/consumers of those row keys are:
--     • settings/[[path]].ts POST 'save'  WRITES  role keys 'college_admin' / 'college_educator'
--       (the College-Admin Settings UI — src/pages/admin/collegeAdmin/Settings.tsx).
--     • user/handlers/actions.ts get-permissions  READS by resolveSchoolRole's output, which
--       (functions/lib/schoolRole.ts PERMISSION_ROLE_CODE_PRECEDENCE) can be
--       'college_admin' / 'school_admin' / 'college_educator' / 'school_educator' (resolved
--       straight from the verified JWT), in addition to the 10 school-internal sub-roles.
--
--   Therefore the lookup must ALSO contain the SSO roles that double as permission codes:
--       college_admin, college_educator, school_educator
--   (school_admin is already present above). Without these, the role_code FK would REJECT
--   the settings insert and get-permissions would match ZERO rows for those users — a
--   behavior regression vs the legacy `role_type` (`user_role` enum) query, which accepted
--   them because the enum includes them. Adding them here makes the P4 backfill (20.2) and
--   the `.eq('role_code', …)` query both COHERENT and preserves behavior 1:1.
--
--   These 3 SSO-permission codes are kept SEPARATE from the frontend `SchoolInternalRole`
--   union (src/shared/types/permissions.ts) and the Functions mirror `SCHOOL_INTERNAL_ROLE_CODES`
--   (functions/lib/schoolRole.ts) ON PURPOSE: those types model the genuinely-school-internal
--   sub-role TAXONOMY and must NOT be polluted with SSO roles. Only the DB lookup is widened
--   to the broader permission-role-code domain. (`isSchoolInternalRoleCode` validates only the
--   school_educators-sourced path, which never yields these 3, so the 10-code mirror stays correct.)
--
--   NOT seeded: `university_admin`. It is NOT in PERMISSION_ROLE_CODE_PRECEDENCE, the
--   Settings UI never writes it, and both tables are empty (no legacy rows), so nothing
--   produces or queries it as a permission role_code. Add it ONLY if/when a real producer
--   appears (evidence-based; no speculative seeding).

--
-- DML ONLY: this file contains INSERTs only. The table already exists from task 15.4 (DDL
--   migration). Per steering 04-database-api-standards.md: migrations = DDL, seeds = DML.
--
-- IDEMPOTENT: the INSERT uses ON CONFLICT (code) DO NOTHING, so re-running `db reset` /
--   re-seed is harmless.
--
-- NO FK BOOTSTRAP NEEDED: unlike task 17.1 (role_categories FKs roles(name)),
--   `school_internal_roles` is a STANDALONE lookup with no FK to other tables, so no
--   prerequisite rows must be bootstrapped first.
--
-- FILE-ONLY: this file is written to disk. It is NOT executed here. Applying seeds
--   (`supabase db reset`) is a separate DB operation; task 17.3 verifies state after sync.

INSERT INTO public.school_internal_roles (code, label) VALUES
  ('principal',         'Principal'),
  ('vice_principal',    'Vice Principal'),
  ('it_admin',          'IT Admin'),
  ('class_teacher',     'Class Teacher'),
  ('subject_teacher',   'Subject Teacher'),
  ('accountant',        'Accountant'),
  ('librarian',         'Librarian'),
  ('parent',            'Parent'),
  ('career_counselor',  'Career Counselor'),
  ('school_admin',      'School Admin'),
  -- SSO roles that ALSO serve as permission role_codes (task 20.3 — see TAXONOMY
  -- DISTINCTION above). Required so the P4 `role_code` FK accepts the values the
  -- College-Admin Settings UI writes and the values resolveSchoolRole returns from
  -- the JWT. NOT part of the frontend SchoolInternalRole taxonomy.
  ('college_admin',     'College Admin'),
  ('college_educator',  'College Educator'),
  ('school_educator',   'School Educator')
ON CONFLICT (code) DO NOTHING;
