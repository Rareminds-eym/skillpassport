BEGIN;

-- Add specializations column to programs table for College Admin Program Management
-- Stores single or multiple specializations (e.g. Artificial Intelligence, Cybersecurity, Data Science)
-- text[] so UI can save string[] directly; legacy comma-string is split in app code.

ALTER TABLE "public"."programs"
  ADD COLUMN IF NOT EXISTS "specializations" text[] DEFAULT '{}'::text[];

COMMENT ON COLUMN "public"."programs"."specializations" IS 'Single or multiple specializations within the program (e.g. Artificial Intelligence, Cybersecurity). Stored as text[]; UI accepts comma-separated input.';

COMMIT;
