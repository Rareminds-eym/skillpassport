-- Migration: Remove indexes blocking large JSON storage in assessment_snapshot_v2
-- Created: 2026-02-12
-- Issue: PostgreSQL GIN index has 8191 byte limit, but snapshot JSON is ~69KB

-- Drop the GIN index on the entire assessment_snapshot_v2 column
DROP INDEX IF EXISTS idx_assessment_snapshot_v2;

-- Drop the btree index on sections key (also blocks large JSON)
DROP INDEX IF EXISTS idx_assessment_snapshot_sections;

-- Note: The assessment_snapshot_v2 column can still be queried using:
-- - Full table scans (acceptable for assessment data)
-- - Direct column retrieval by attempt_id (uses primary key index)
-- - JSON operators work but without index acceleration
