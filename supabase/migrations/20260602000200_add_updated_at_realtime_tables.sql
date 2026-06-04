-- Migration: Add updated_at to shortlist_candidates, pipeline_activities, placements
-- Phase: 1 of 1 (Expand)
-- Breaking: No
-- Rollback: 
--   ALTER TABLE shortlist_candidates DROP COLUMN updated_at;
--   ALTER TABLE pipeline_activities DROP COLUMN updated_at;
--   ALTER TABLE placements DROP COLUMN updated_at;
--   DROP TRIGGER IF EXISTS set_updated_at ON shortlist_candidates;
--   DROP TRIGGER IF EXISTS set_updated_at ON pipeline_activities;
--   DROP FUNCTION IF EXISTS set_shortlist_candidates_updated_at();
--   DROP FUNCTION IF EXISTS set_pipeline_activities_updated_at();
--
-- Context: Enable SSE realtime polling for these tables
-- The queryChanges function requires an updated_at column to detect row changes

-- === shortlist_candidates ===

ALTER TABLE shortlist_candidates
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

UPDATE shortlist_candidates
  SET updated_at = added_at
  WHERE updated_at != added_at;

CREATE OR REPLACE FUNCTION set_shortlist_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON shortlist_candidates
  FOR EACH ROW
  EXECUTE FUNCTION set_shortlist_candidates_updated_at();

-- === pipeline_activities ===

ALTER TABLE pipeline_activities
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

UPDATE pipeline_activities
  SET updated_at = created_at
  WHERE updated_at != created_at;

CREATE OR REPLACE FUNCTION set_pipeline_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON pipeline_activities
  FOR EACH ROW
  EXECUTE FUNCTION set_pipeline_activities_updated_at();

-- === placements ===
-- Note: placements already has updatedAt (camelCase) with DEFAULT now(),
-- and a pre-existing trigger "update_placements_timestamp" that does
-- NEW.updated_at = NOW() via update_timestamp(). Once the column exists,
-- that trigger will keep it in sync. No additional trigger needed.

ALTER TABLE placements
  ADD COLUMN updated_at TIMESTAMPTZ;

-- COALESCE handles rows where updatedAt is NULL (fall back to createdAt, then now())
UPDATE placements
  SET updated_at = COALESCE("updatedAt", "createdAt", now());

ALTER TABLE placements
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;
