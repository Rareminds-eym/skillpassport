-- ============================================================================
-- ROLLBACK SCRIPT - Restore original subscription_plans structure
-- ============================================================================
-- Use this if you need to revert the redesign migration
-- ============================================================================

BEGIN;

-- Restore from backup
DROP TABLE IF EXISTS subscription_plans CASCADE;
CREATE TABLE subscription_plans AS SELECT * FROM subscription_plans_backup;

-- Recreate original indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_code ON subscription_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active);

-- Drop new table and functions
DROP TABLE IF EXISTS subscription_plans_new CASCADE;
DROP FUNCTION IF EXISTS get_plan_for_entity(text, text);
DROP FUNCTION IF EXISTS get_all_plans_for_entity(text);
DROP FUNCTION IF EXISTS update_subscription_plans_updated_at();

COMMIT;
