-- Migration: Add Lifetime Subscription Constraint
-- Description: Ensures lifetime subscriptions have NULL end_date and non-lifetime have valid end_date
-- Date: 2026-05-15
-- Fixes Issue #32: Freemium Plan Has Lifetime Duration But No End Date Validation

-- Add check constraint to enforce lifetime subscription rules
ALTER TABLE subscriptions 
ADD CONSTRAINT check_lifetime_subscription 
CHECK (
  (billing_cycle = 'lifetime' AND subscription_end_date IS NULL) 
  OR 
  (billing_cycle != 'lifetime' AND subscription_end_date IS NOT NULL)
);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT check_lifetime_subscription ON subscriptions IS 
'Ensures lifetime subscriptions have NULL end_date and non-lifetime subscriptions have a valid end_date';

-- Verify existing data complies with the constraint
DO $$
DECLARE
  violation_count INTEGER;
BEGIN
  -- Check for violations
  SELECT COUNT(*) INTO violation_count
  FROM subscriptions
  WHERE (billing_cycle = 'lifetime' AND subscription_end_date IS NOT NULL)
     OR (billing_cycle != 'lifetime' AND subscription_end_date IS NULL);
  
  IF violation_count > 0 THEN
    RAISE WARNING 'Found % subscriptions violating lifetime constraint. These need manual review.', violation_count;
  ELSE
    RAISE NOTICE 'All existing subscriptions comply with lifetime constraint';
  END IF;
END $$;
