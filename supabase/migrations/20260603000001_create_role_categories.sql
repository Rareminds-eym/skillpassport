-- Migration: Create the app-owned `public.role_categories` grouping table.
-- Spec: rbac-architecture-violations-fix  |  Phase: P3  |  Task: 15.3
--
-- What/Why:
--   `role_categories` is an APP-OWNED reference table (design.md "Data Models /
--   New: role_categories" + E5.2). It groups the shadow roles into the five coarse
--   authorization categories (admin / educator / recruiter / learner / system) with a
--   `priority` ordering. It is NOT an authorization source itself — Cloudflare Functions
--   enforce authz from the verified JWT. This table backs runtime category resolution:
--   the Functions `requireAdmin` guard and the category helpers (e.g. `rolesInCategory
--   (env,'admin')`) query it at runtime, and the type generator (task 18) reads it.
--
--   It FKs `role_name → public.roles(name)` (the name-keyed shadow created by the task
--   15.2 migration 20260603000000_replace_roles_shadow.sql). ON DELETE CASCADE so a
--   role removed from the shadow drops its category rows automatically.
--
-- Ordering: this file's timestamp (20260603000001) sorts AFTER the 15.2 migration
--   (20260603000000) so the FK target `public.roles(name)` already exists.
--
-- DDL ONLY: no DML / seed data here. Seeding the categories for the 16 roles is task
--   17.1 (a separate seed file).
--
-- APPROVAL-GATED: This file is written to disk only. Execution (supabase db push /
--   migration up) is task 15.5 and MUST be proposed and explicitly approved before running.

-- 1) Create the table (exact shape per design.md Data Models / E5.2).
CREATE TABLE public.role_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name  TEXT NOT NULL REFERENCES public.roles(name) ON DELETE CASCADE,
  category   TEXT NOT NULL CHECK (category IN ('admin','educator','recruiter','learner','system')),
  priority   INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role_name, category)
);

COMMENT ON TABLE public.role_categories IS
  'App-owned grouping of shadow roles into coarse authorization categories (admin/educator/recruiter/learner/system) with a priority ordering. Read at runtime by Functions category helpers (requireAdmin, rolesInCategory). NOT an authorization source.';

-- 2) Index to support runtime category lookups (rolesInCategory(env,'category')).
--    role_name lookups are already served by the UNIQUE (role_name, category) index
--    (leading column = role_name), so only a category index is added here.
CREATE INDEX role_categories_category_idx ON public.role_categories (category);

-- 3) Keep `updated_at` fresh on UPDATE, matching the base-schema convention
--    (20260526000000_schema.sql defines public.set_updated_at_timestamp() and wires a
--    per-table set_<table>_timestamp BEFORE UPDATE trigger, e.g. set_roles_timestamp).
CREATE TRIGGER set_role_categories_timestamp
  BEFORE UPDATE ON public.role_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- 4) Grants — match the access parity of the sibling shadow `public.roles`
--    (GRANT ALL to anon / authenticated / service_role, per 20260603000000 and the base
--    schema). The service_role (the Functions client) reads this reference data; the
--    read-only-at-app-layer semantics are enforced in code, not via grants. No RLS was
--    present on the sibling `roles` shadow, so none is added here (Functions use
--    service_role, which bypasses RLS regardless).
GRANT ALL ON TABLE public.role_categories TO anon;
GRANT ALL ON TABLE public.role_categories TO authenticated;
GRANT ALL ON TABLE public.role_categories TO service_role;
