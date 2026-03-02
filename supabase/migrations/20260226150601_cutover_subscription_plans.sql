-- ============================================================================
-- CUTOVER SCRIPT - Switch from old to new subscription_plans table
-- ============================================================================
-- Run this AFTER testing subscription_plans_new thoroughly
-- This is the point of no return (unless you run rollback)
-- ============================================================================

BEGIN;

-- Verify new table has data
DO $$
DECLARE
  new_count integer;
BEGIN
  SELECT COUNT(*) INTO new_count FROM subscription_plans_new;
  IF new_count = 0 THEN
    RAISE EXCEPTION 'subscription_plans_new is empty! Aborting cutover.';
  END IF;
  RAISE NOTICE 'Found % plans in new table', new_count;
END $$;

-- Drop old table and rename new one
DROP TABLE subscription_plans CASCADE;
ALTER TABLE subscription_plans_new RENAME TO subscription_plans;

-- Rename indexes
ALTER INDEX idx_subscription_plans_new_plan_code RENAME TO idx_subscription_plans_plan_code;
ALTER INDEX idx_subscription_plans_new_business_type RENAME TO idx_subscription_plans_business_type;
ALTER INDEX idx_subscription_plans_new_is_active RENAME TO idx_subscription_plans_is_active;
ALTER INDEX idx_subscription_plans_new_pricing_matrix RENAME TO idx_subscription_plans_pricing_matrix;
ALTER INDEX idx_subscription_plans_new_entity_config RENAME TO idx_subscription_plans_entity_config;
ALTER INDEX idx_subscription_plans_new_applicable_entities RENAME TO idx_subscription_plans_applicable_entities;

-- Rename trigger
DROP TRIGGER IF EXISTS subscription_plans_new_updated_at ON subscription_plans;
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

COMMIT;

-- Verify cutover
SELECT 
  COUNT(*) as total_plans,
  COUNT(DISTINCT plan_code) as unique_plan_codes,
  COUNT(DISTINCT business_type) as business_types
FROM subscription_plans;
