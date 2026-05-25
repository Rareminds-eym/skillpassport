-- Migration: Clear addon event tables for addon catalog refresh
--
-- Since all addons in the catalog are being replaced (new feature_keys, names, prices),
-- any stale event/discount data referencing old addons is no longer valid.
-- These tables are empty in production, but this ensures a clean slate.

BEGIN;

DELETE FROM public.addon_discount_codes;
DELETE FROM public.addon_events;

COMMIT;
