-- Add specialization column to learners table for college learners
-- Stores free-text specialization within program (e.g. AI/ML, Finance, Cybersecurity, Marketing)
-- Distinct from programName (e.g. B.Tech, BCA, MBA) and branch_field

ALTER TABLE "public"."learners"
  ADD COLUMN IF NOT EXISTS "specialization" character varying(150);

COMMENT ON COLUMN "public"."learners"."specialization" IS 'Specialization / focus area within the program (e.g. Artificial Intelligence, Finance, Cybersecurity). Free-text, college learners only.';

CREATE INDEX IF NOT EXISTS "idx_learners_specialization" ON "public"."learners" USING "btree" ("specialization") WHERE ("specialization" IS NOT NULL);
