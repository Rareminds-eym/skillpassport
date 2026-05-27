-- Migration: Add Database Indexes for Subscription System
-- Description: Create indexes to optimize subscription plan and subscription queries
-- Date: 2026-05-13

-- Index 1: subscription_plans(plan_code) where is_active = true
-- Purpose: Optimize queries that look up plans by plan_code (e.g., 'pay_as_you_go')
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_code_active 
ON subscription_plans(plan_code) 
WHERE is_active = true;

-- Index 2: subscription_plans(business_type) where is_active = true
-- Purpose: Optimize queries that filter plans by business type
CREATE INDEX IF NOT EXISTS idx_subscription_plans_business_type_active 
ON subscription_plans(business_type) 
WHERE is_active = true;

-- Index 3: subscription_plans(applicable_entities) using GIN
-- Purpose: Optimize queries that search within the applicable_entities array
CREATE INDEX IF NOT EXISTS idx_subscription_plans_applicable_entities 
ON subscription_plans USING GIN (applicable_entities);

-- Index 4: subscriptions(user_id) where status = 'active'
-- Purpose: Optimize queries that fetch active subscriptions for a specific user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_active 
ON subscriptions(user_id) 
WHERE status = 'active';

-- Index 5: subscriptions(plan_id)
-- Purpose: Optimize queries that join subscriptions with subscription_plans
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id 
ON subscriptions(plan_id);

-- Index 6: subscriptions(status, subscription_start_date, subscription_end_date)
-- Purpose: Optimize queries that filter by subscription status and date ranges
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_dates 
ON subscriptions(status, subscription_start_date, subscription_end_date);

-- Verification queries (commented out - uncomment to verify indexes were created)
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('subscription_plans', 'subscriptions') ORDER BY tablename, indexname;
