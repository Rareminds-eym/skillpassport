-- Seed: role_categories for the 16 canonical SSO roles (+ idempotent local roles bootstrap)
-- Spec: rbac-architecture-violations-fix  |  Phase: P3  |  Task: 17.1
--
-- WHAT / WHY
--   Seeds the app-owned `public.role_categories` table (DDL created by migration
--   20260603000001_create_role_categories.sql) so every canonical SSO role is grouped
--   into its authorization category. The mapping below mirrors the canonical
--   `ROLE_CATEGORIES` constant EXACTLY — the single source of truth used by both:
--     - src/shared/types/generated/roles.ts   (frontend / type generator), and
--     - functions/lib/roleCategories.ts        (Cloudflare Functions runtime mirror).
--
--   `role_categories` is NOT an authorization source. Cloudflare Functions enforce authz
--   from the verified JWT; this table only backs runtime category resolution
--   (requireAdmin / rolesInCategory) and the type generator (task 18).
--
-- DML ONLY: this file contains INSERTs only. The tables already exist from task 15 (DDL
--   migrations). Per steering 04-database-api-standards.md: migrations = DDL, seeds = DML.
--
-- IDEMPOTENT: every INSERT uses ON CONFLICT DO NOTHING, so re-running `db reset` / re-seed
--   is harmless.
--
-- FILE-ONLY: this file is written to disk. It is NOT executed here. Applying seeds
--   (`supabase db reset`) is a separate DB operation; task 17.3 verifies state after sync.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 — LOCAL roles bootstrap (FK prerequisite)
-- ─────────────────────────────────────────────────────────────────────────────
--   `role_categories.role_name` FKs `public.roles(name)`. On a fresh `db reset` (or any
--   local DB where the sso-worker sync `syncRolesShadow()` has not run yet), the `roles`
--   shadow is EMPTY, so seeding `role_categories` would violate that FK.
--
--   To keep this seed self-contained, we bootstrap the 16 canonical role names into
--   `public.roles` first, with ON CONFLICT (name) DO NOTHING. This is a LOCAL / RESET-time
--   convenience ONLY:
--     - In PRODUCTION the `roles` shadow is kept current by the sso-worker sync
--       (functions/lib/sync-shadow.ts `syncRolesShadow()` via the SSO_SERVICE RPC) — NOT
--       by this seed. ON CONFLICT DO NOTHING means that when the sync has already populated
--       `roles`, this bootstrap is a no-op and never clobbers synced rows.
--     - `sso_role_id` is left NULL here (the sync backfills the real sso-worker roles.id);
--       `synced_at` is set to now() to satisfy the NOT NULL default semantics.
--   This is NOT an authorization source; it only satisfies the FK so categories can seed.

INSERT INTO public.roles (name, description, sso_role_id, synced_at) VALUES
  ('owner',            'Organization owner (full control)',                          NULL, now()),
  ('admin',            'Generic organization administrator',                         NULL, now()),
  ('member',           'Generic organization member (no admin category)',            NULL, now()),
  ('super_admin',      'Platform super administrator (system)',                      NULL, now()),
  ('rm_admin',         'Rareminds platform administrator (system)',                  NULL, now()),
  ('rm_manager',       'Rareminds platform manager (system)',                        NULL, now()),
  ('company_admin',    'Company administrator (admin + recruiter)',                  NULL, now()),
  ('educator',         'Generic educator',                                           NULL, now()),
  ('school_educator',  'School educator',                                            NULL, now()),
  ('college_educator', 'College educator',                                           NULL, now()),
  ('school_admin',     'School administrator',                                       NULL, now()),
  ('college_admin',    'College administrator',                                      NULL, now()),
  ('university_admin', 'University administrator',                                   NULL, now()),
  ('recruiter',        'Recruiter',                                                  NULL, now()),
  ('hr',               'Human resources (recruiter category)',                       NULL, now()),
  ('learner',          'Learner / end user',                                         NULL, now())
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2 — role_categories rows (mirrors ROLE_CATEGORIES EXACTLY)
-- ─────────────────────────────────────────────────────────────────────────────
--   PRIORITY SCHEME (documented): priority encodes CATEGORY PRECEDENCE. When a role
--   belongs to more than one category, the row with the higher priority is its PRIMARY
--   category. The tiers (highest → lowest):
--       system    = 500
--       admin     = 400
--       recruiter = 300
--       educator  = 200
--       learner   = 100
--   Consequence: `company_admin` (admin=400, recruiter=300) resolves to ADMIN as its
--   primary category, consistent with primary-role selection. All rows in a given
--   category share that category's tier value for predictable, consistent ordering.
--
--   MAPPING NOTES (decisions, per the canonical ROLE_CATEGORIES):
--     - `company_admin` intentionally appears in TWO categories (admin AND recruiter).
--       The UNIQUE(role_name, category) constraint permits this (different category) and
--       it is INTENDED — company_admin is both an org admin and a recruiter.
--     - `member` is OMITTED: ROLE_CATEGORIES does not list `member` in any category, so it
--       has no category row here. (It still exists in `public.roles` as a valid SSO role.)
--       Omitting it is correct — the seed reflects ROLE_CATEGORIES exactly.

INSERT INTO public.role_categories (role_name, category, priority) VALUES
  -- admin (priority 400)
  ('admin',            'admin',     400),
  ('company_admin',    'admin',     400),
  ('owner',            'admin',     400),
  ('school_admin',     'admin',     400),
  ('college_admin',    'admin',     400),
  ('university_admin', 'admin',     400),
  -- educator (priority 200)
  ('educator',         'educator',  200),
  ('school_educator',  'educator',  200),
  ('college_educator', 'educator',  200),
  -- recruiter (priority 300)
  ('recruiter',        'recruiter', 300),
  ('company_admin',    'recruiter', 300),
  ('hr',               'recruiter', 300),
  -- learner (priority 100)
  ('learner',          'learner',   100),
  -- system (priority 500)
  ('super_admin',      'system',    500),
  ('rm_admin',         'system',    500),
  ('rm_manager',       'system',    500)
ON CONFLICT (role_name, category) DO NOTHING;
