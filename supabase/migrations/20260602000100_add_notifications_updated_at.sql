-- Migration: Add updated_at to notifications table
-- Phase: 1 of 1 (Expand)
-- Breaking: No
-- Rollback: ALTER TABLE notifications DROP COLUMN updated_at; DROP TRIGGER IF EXISTS set_updated_at ON notifications;
--
-- Context: Enable SSE realtime polling for the notifications table
-- The queryChanges function requires an updated_at column to detect row changes

ALTER TABLE notifications
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

-- Backfill existing rows with their created_at timestamp
UPDATE notifications
  SET updated_at = created_at
  WHERE updated_at != created_at;

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION set_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notifications_updated_at();
