-- Recreate foreign keys that were dropped during cutover
-- First, remove NOT NULL constraints temporarily

ALTER TABLE organization_subscriptions ALTER COLUMN subscription_plan_id DROP NOT NULL;
ALTER TABLE organization_invitations ALTER COLUMN subscription_plan_id DROP NOT NULL;

-- Clean up invalid references in subscriptions
UPDATE subscriptions 
SET plan_id = NULL 
WHERE plan_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM subscription_plans WHERE id = subscriptions.plan_id);

-- Clean up invalid references in organization_subscriptions  
UPDATE organization_subscriptions
SET subscription_plan_id = NULL
WHERE subscription_plan_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM subscription_plans WHERE id = organization_subscriptions.subscription_plan_id);

-- Clean up invalid references in organization_invitations
UPDATE organization_invitations
SET subscription_plan_id = NULL
WHERE subscription_plan_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM subscription_plans WHERE id = organization_invitations.subscription_plan_id);

-- Clean up invalid references in subscription_plan_features
DELETE FROM subscription_plan_features
WHERE plan_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM subscription_plans WHERE id = subscription_plan_features.plan_id);

-- Now recreate foreign keys
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS fk_subscriptions_plan_id,
  ADD CONSTRAINT fk_subscriptions_plan_id 
    FOREIGN KEY (plan_id) 
    REFERENCES subscription_plans(id) 
    ON DELETE SET NULL;

ALTER TABLE organization_subscriptions
  DROP CONSTRAINT IF EXISTS organization_subscriptions_subscription_plan_id_fkey,
  ADD CONSTRAINT organization_subscriptions_subscription_plan_id_fkey 
    FOREIGN KEY (subscription_plan_id) 
    REFERENCES subscription_plans(id)
    ON DELETE SET NULL;

ALTER TABLE organization_invitations
  DROP CONSTRAINT IF EXISTS organization_invitations_subscription_plan_id_fkey,
  ADD CONSTRAINT organization_invitations_subscription_plan_id_fkey 
    FOREIGN KEY (subscription_plan_id) 
    REFERENCES subscription_plans(id)
    ON DELETE SET NULL;

ALTER TABLE subscription_plan_features
  DROP CONSTRAINT IF EXISTS subscription_plan_features_plan_id_fkey,
  ADD CONSTRAINT subscription_plan_features_plan_id_fkey 
    FOREIGN KEY (plan_id) 
    REFERENCES subscription_plans(id) 
    ON DELETE CASCADE;
