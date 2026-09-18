-- Soundarya College: raise subscription seats so license pool allocation fits.
-- Run BEFORE seed_soundarya_college_enterprise.sql. Without this,
-- validate_pool_allocation() rejects the seed with
-- 'Total pool allocation (5000) exceeds subscription seats (1)'.
-- NOTE: subscription_cache mirrors the SSO DB — also raise seats at the
-- source (SSO subscriptions.seat_count) or the next re-sync overwrites this.
UPDATE subscription_cache SET seat_count = 5000, updated_at = NOW()
WHERE id = 'd3876903-b74e-55d7-910f-90907ea3e11f';
