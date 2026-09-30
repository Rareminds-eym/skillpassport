-- Migration: Drop school_id from learner_reports
-- Reason: school_id NOT NULL was blocking B2C learners (no org) from having
--         their report downloads tracked. The learner_id FK to learners(id)
--         is sufficient to identify the learner.

-- Step 1: Drop RLS policies that depend on school_id
DROP POLICY IF EXISTS "School staff can manage reports" ON "public"."learner_reports";
DROP POLICY IF EXISTS "School staff can view reports" ON "public"."learner_reports";

-- Step 2: Drop the foreign key constraint
ALTER TABLE "public"."learner_reports"
    DROP CONSTRAINT IF EXISTS "learner_reports_school_id_fkey";

-- Step 3: Drop the index on school_id
DROP INDEX IF EXISTS "public"."idx_learner_reports_school";

-- Step 4: Drop the school_id column
ALTER TABLE "public"."learner_reports"
    DROP COLUMN IF EXISTS "school_id";
