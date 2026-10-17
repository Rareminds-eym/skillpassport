-- Reset-time role shadow and category bootstrap, restored from the archived
-- RBAC seed. SSO sync owns production roles; existing synced rows are preserved.

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
