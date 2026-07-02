-- Migration: Make organization name nullable for recruiter onboarding flow
-- 
-- Background:
-- Previously, org_name was required at signup. Now recruiters sign up without
-- an org name and provide it during onboarding Step 1 (after subscription).
-- This syncs from SSO via the auth-sync-consumer queue.
--
-- This migration:
-- 1. Allows organizations.name to be NULL
-- 2. Adds a check to ensure either name is provided OR it's a new signup

-- Make organization name nullable
ALTER TABLE organizations 
ALTER COLUMN name DROP NOT NULL;

-- Add comment explaining nullable name
COMMENT ON COLUMN organizations.name IS 
  'Organization name. Can be NULL temporarily during recruiter onboarding (first 24 hours after creation). Synced from SSO. Must be set during onboarding Step 1.';
