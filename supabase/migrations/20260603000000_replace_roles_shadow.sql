-- Migration: Replace the legacy `public.roles` shadow with the optimised, name-keyed shadow
-- Spec: rbac-architecture-violations-fix  |  Phase: P3  |  Task: 15.2
-- Pattern: Expand-Migrate-Contract → this is the EXPAND/replace step (structure only).
-- Breaking: No data loss (verification 2026-06-07 confirmed `public.roles` = 0 rows
--           and its only dependent `role_permissions` = 0 rows).
--
-- What/Why:
--   The sso-worker `roles` table is the single source of truth for authorization roles.
--   The app DB keeps only a READ-ONLY shadow, synced from the sso-worker via the
--   SSO_SERVICE RPC (sync implemented in task 16). This migration replaces the pre-SSO
--   shadow (name varchar(50), description text NOT NULL, created_at, updated_at) with the
--   optimised shape from design.md "Data Models": keyed on `name`, plus `sso_role_id`
--   (traceability to sso-worker roles.id) and `synced_at`. The shadow is NOT an
--   authorization source — Cloudflare Functions enforce authz from the verified JWT.
--
-- DDL ONLY: no DML / seed data here (reference data is seeded in task 17).
--
-- APPROVAL-GATED: This file is written to disk only. Execution (supabase db push /
--   migration up) is task 15.5 and MUST be proposed and explicitly approved before running.
--   The `DROP TABLE ... CASCADE` below is destructive; it is safe only because the
--   verification confirmed both `roles` and `role_permissions` are empty.

-- 1) Drop the existing shadow.
--    Verification (2026-06-07 P3 role-tables report) found the ONLY FK dependent is
--    `role_permissions.role → roles(name)` via constraint `role_permissions_role_fkey`
--    (ON DELETE CASCADE). No views/functions/RLS/app-code reference `public.roles`.
--    CASCADE drops that FK CONSTRAINT only; the `role_permissions` TABLE and its rows
--    survive (the table is empty and code-unused). Per the explicit user decision,
--    `role_permissions` is NOT dropped — it is RE-FK'd to the new `roles` in step 3.
DROP TABLE IF EXISTS public.roles CASCADE;

-- 2) Recreate the optimised, name-keyed shadow (exact shape per design.md Data Models).
CREATE TABLE public.roles (
  name        TEXT PRIMARY KEY,            -- canonical role name (matches sso-worker roles.name)
  description TEXT,
  sso_role_id UUID,                        -- optional: sso-worker roles.id for traceability
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.roles IS
  'Read-only optimised shadow of sso-worker roles. Synced via SSO_SERVICE RPC. NOT an authorization source.';

-- 3) Restore the dependency per the explicit user decision.
--    Step 1's CASCADE removed `role_permissions_role_fkey`; recreate it pointing at the
--    new name-keyed PK. Note: `role_permissions.role` is `varchar(50)` and the new
--    `roles.name` is `TEXT`. In PostgreSQL varchar(n) and text are the same underlying
--    type family (varchar is text with a length constraint) and are directly comparable,
--    so a varchar(50) → text FK is valid and does NOT require a type change. The 50-char
--    cap on `role_permissions.role` only constrains the referencing column's values.
ALTER TABLE public.role_permissions
  ADD CONSTRAINT role_permissions_role_fkey
  FOREIGN KEY (role) REFERENCES public.roles(name) ON DELETE CASCADE;

-- 4) Replicate the grants the previous `public.roles` had (GRANT ALL to anon /
--    authenticated / service_role, per base schema 20260526000000_schema.sql), so the
--    shadow keeps the same access parity. The service_role (the Functions client) needs
--    write access to run the sync; read-only semantics are enforced at the app layer,
--    not via grants. (No RLS was present on the original table — none is added here.)
GRANT ALL ON TABLE public.roles TO anon;
GRANT ALL ON TABLE public.roles TO authenticated;
GRANT ALL ON TABLE public.roles TO service_role;
