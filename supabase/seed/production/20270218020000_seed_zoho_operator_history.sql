BEGIN;
-- Existing rows acquire their historical timestamp after the additive column migration.
-- Newly created rows have created_at <= updated_at and remain unchanged on rerun.
UPDATE public.zoho_candidate_administration_progress SET created_at=updated_at WHERE created_at>updated_at;
COMMIT;
