-- Human review is the default for every school and college: an organization that
-- has not chosen a mode is evaluated by educators, not the AI. The application
-- treats a missing row as human_only (see functions/lib/lte/review-defaults.ts);
-- this keeps the table's own default and documentation in step.
-- Existing rows are explicit choices and are left exactly as they are.
ALTER TABLE public.lte_review_org_settings
  ALTER COLUMN evaluation_mode SET DEFAULT 'human_only';
COMMENT ON TABLE public.lte_review_org_settings IS
  'Administrator-chosen LTE artifact evaluation mode per organisation (school/college). Missing row = human_only (the default). Learners with no organisation are evaluated by the AI.';
