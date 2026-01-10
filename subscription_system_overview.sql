-- ============================================================================
-- SUBSCRIPTION SYSTEM OVERVIEW
-- ============================================================================
-- This file provides a comprehensive overview of the subscription system
-- including plans, addons, bundles, entitlements, and payment integration
-- ============================================================================

-- ============================================================================
-- SECTION 1: CORE SUBSCRIPTION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 SUBSCRIPTION PLANS (Master Plan Definitions)
-- ----------------------------------------------------------------------------
-- Defines available subscription plans with pricing and billing cycles
-- Supports both B2B (business) and B2C (consumer) models

SELECT 
    id,
    name,
    description,
    price,
    billing_cycle,        -- monthly, quarterly, annual
    plan_type,            -- B2B or B2C
    is_active,
    features,             -- JSONB field with plan features
    max_users,            -- For B2B plans
    created_at,
    updated_at
FROM subscription_plans
ORDER BY price;

-- Sample query: Get all active plans by type
SELECT * FROM subscription_plans 
WHERE is_active = true 
AND plan_type = 'B2C'
ORDER BY price;


-- ----------------------------------------------------------------------------
-- 1.2 USER SUBSCRIPTIONS (Active Subscription Records)
-- ----------------------------------------------------------------------------
-- Tracks individual user subscriptions with Razorpay integration

SELECT 
    id,
    user_id,
    subscription_plan_id,
    razorpay_subscription_id,  -- Integration with Razorpay
    status,                     -- active, cancelled, expired, pending
    start_date,
    end_date,
    auto_renew,
    payment_method,
    created_at,
    updated_at
FROM subscriptions
WHERE status = 'active';

-- Sample query: Get user's active subscription with plan details
SELECT 
    s.*,
    sp.name as plan_name,
    sp.price,
    sp.billing_cycle
FROM subscriptions s
JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
WHERE s.user_id = 'USER_ID_HERE'
AND s.status = 'active';


-- ============================================================================
-- SECTION 2: FEATURES & ADDONS SYSTEM
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 SUBSCRIPTION PLAN FEATURES (Normalized Features)
-- ----------------------------------------------------------------------------
-- Defines individual features that can be part of plans or sold as addons

SELECT 
    id,
    subscription_plan_id,
    feature_name,
    feature_category,      -- e.g., 'storage', 'analytics', 'support'
    feature_value,         -- JSONB with feature configuration
    is_addon,              -- true if available as addon
    addon_price,           -- price if sold as addon
    description,
    created_at
FROM subscription_plan_features
ORDER BY feature_category, feature_name;

-- Sample query: Get all addon features available for purchase
SELECT * FROM subscription_plan_features
WHERE is_addon = true
ORDER BY addon_price;

-- Sample query: Get features included in a specific plan
SELECT 
    feature_name,
    feature_category,
    feature_value,
    description
FROM subscription_plan_features
WHERE subscription_plan_id = 'PLAN_ID_HERE'
ORDER BY feature_category;


-- ----------------------------------------------------------------------------
-- 2.2 BUNDLES (Feature Bundles)
-- ----------------------------------------------------------------------------
-- Groups multiple features together as discounted packages

SELECT 
    id,
    name,
    description,
    price,
    discount_percentage,
    is_active,
    valid_from,
    valid_until,
    created_at
FROM bundles
WHERE is_active = true
AND (valid_until IS NULL OR valid_until > NOW());

-- Sample query: Get bundle with its features
SELECT 
    b.name as bundle_name,
    b.price as bundle_price,
    b.discount_percentage,
    bf.feature_id,
    spf.feature_name,
    spf.feature_category
FROM bundles b
JOIN bundle_features bf ON b.id = bf.bundle_id
JOIN subscription_plan_features spf ON bf.feature_id = spf.id
WHERE b.id = 'BUNDLE_ID_HERE';


-- ----------------------------------------------------------------------------
-- 2.3 BUNDLE FEATURES (Features in Bundles)
-- ----------------------------------------------------------------------------
-- Links features to bundles

SELECT 
    bundle_id,
    feature_id,
    created_at
FROM bundle_features;


-- ============================================================================
-- SECTION 3: USER ENTITLEMENTS & ACCESS CONTROL
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 USER ENTITLEMENTS (Active Feature Access)
-- ----------------------------------------------------------------------------
-- Tracks which features users have access to (from subscriptions or addons)

SELECT 
    id,
    user_id,
    feature_id,
    source_type,           -- 'subscription', 'addon', 'bundle'
    source_id,             -- ID of subscription/addon/bundle
    granted_at,
    expires_at,
    is_active
FROM user_entitlements
WHERE is_active = true;

-- Sample query: Get all active entitlements for a user
SELECT 
    ue.*,
    spf.feature_name,
    spf.feature_category,
    spf.feature_value
FROM user_entitlements ue
JOIN subscription_plan_features spf ON ue.feature_id = spf.id
WHERE ue.user_id = 'USER_ID_HERE'
AND ue.is_active = true
AND (ue.expires_at IS NULL OR ue.expires_at > NOW());

-- Sample query: Check if user has specific feature access
SELECT EXISTS (
    SELECT 1 FROM user_entitlements ue
    JOIN subscription_plan_features spf ON ue.feature_id = spf.id
    WHERE ue.user_id = 'USER_ID_HERE'
    AND spf.feature_name = 'FEATURE_NAME_HERE'
    AND ue.is_active = true
    AND (ue.expires_at IS NULL OR ue.expires_at > NOW())
) as has_access;


-- ============================================================================
-- SECTION 4: ADDON MANAGEMENT
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1 ADDON EVENTS (Addon Activity Tracking)
-- ----------------------------------------------------------------------------
-- Tracks addon-related events (purchases, activations, cancellations)

SELECT 
    id,
    user_id,
    addon_id,              -- References subscription_plan_features where is_addon=true
    event_type,            -- 'purchased', 'activated', 'cancelled', 'expired'
    event_data,            -- JSONB with event details
    created_at
FROM addon_events
ORDER BY created_at DESC;

-- Sample query: Get addon purchase history for a user
SELECT 
    ae.*,
    spf.feature_name,
    spf.addon_price
FROM addon_events ae
JOIN subscription_plan_features spf ON ae.addon_id = spf.id
WHERE ae.user_id = 'USER_ID_HERE'
AND ae.event_type = 'purchased'
ORDER BY ae.created_at DESC;


-- ----------------------------------------------------------------------------
-- 4.2 ADDON DISCOUNT CODES
-- ----------------------------------------------------------------------------
-- Manages discount codes for addon purchases

SELECT 
    id,
    code,
    discount_type,         -- 'percentage' or 'fixed'
    discount_value,
    applicable_addons,     -- JSONB array of addon IDs
    max_uses,
    current_uses,
    valid_from,
    valid_until,
    is_active
FROM addon_discount_codes
WHERE is_active = true
AND (valid_until IS NULL OR valid_until > NOW())
AND (max_uses IS NULL OR current_uses < max_uses);

-- Sample query: Validate discount code for addon
SELECT * FROM addon_discount_codes
WHERE code = 'DISCOUNT_CODE_HERE'
AND is_active = true
AND NOW() BETWEEN valid_from AND COALESCE(valid_until, NOW() + INTERVAL '100 years')
AND (max_uses IS NULL OR current_uses < max_uses);


-- ----------------------------------------------------------------------------
-- 4.3 ADDON PENDING ORDERS
-- ----------------------------------------------------------------------------
-- Tracks pending addon purchases before payment completion

SELECT 
    id,
    user_id,
    addon_id,
    quantity,
    total_price,
    discount_code_id,
    status,                -- 'pending', 'completed', 'cancelled', 'failed'
    razorpay_order_id,
    created_at,
    updated_at
FROM addon_pending_orders
WHERE status = 'pending';

-- Sample query: Get pending orders for a user
SELECT 
    apo.*,
    spf.feature_name,
    spf.addon_price
FROM addon_pending_orders apo
JOIN subscription_plan_features spf ON apo.addon_id = spf.id
WHERE apo.user_id = 'USER_ID_HERE'
AND apo.status = 'pending';


-- ============================================================================
-- SECTION 5: PAYMENT INTEGRATION
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1 PAYMENT TRANSACTIONS
-- ----------------------------------------------------------------------------
-- Records all payment transactions

SELECT 
    id,
    user_id,
    amount,
    currency,
    payment_method,
    transaction_type,      -- 'subscription', 'addon', 'bundle'
    reference_id,          -- ID of subscription/addon/bundle
    razorpay_payment_id,
    status,                -- 'pending', 'success', 'failed', 'refunded'
    created_at,
    updated_at
FROM payment_transactions
ORDER BY created_at DESC;

-- Sample query: Get payment history for a user
SELECT * FROM payment_transactions
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC;

-- Sample query: Get successful payments summary
SELECT 
    transaction_type,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    currency
FROM payment_transactions
WHERE status = 'success'
GROUP BY transaction_type, currency;


-- ----------------------------------------------------------------------------
-- 5.2 RAZORPAY ORDERS
-- ----------------------------------------------------------------------------
-- Tracks Razorpay order creation and status

SELECT 
    id,
    user_id,
    razorpay_order_id,
    amount,
    currency,
    status,                -- 'created', 'attempted', 'paid'
    order_type,            -- 'subscription', 'addon', 'bundle'
    reference_id,
    receipt,
    notes,                 -- JSONB with additional order info
    created_at,
    updated_at
FROM razorpay_orders
ORDER BY created_at DESC;

-- Sample query: Get Razorpay orders for a user
SELECT * FROM razorpay_orders
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC;


-- ============================================================================
-- SECTION 6: SUBSCRIPTION LIFECYCLE MANAGEMENT
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6.1 SUBSCRIPTION CANCELLATIONS
-- ----------------------------------------------------------------------------
-- Tracks subscription cancellation requests and reasons

SELECT 
    id,
    subscription_id,
    user_id,
    cancellation_reason,
    cancellation_type,     -- 'immediate', 'end_of_period'
    cancelled_at,
    effective_date,        -- When cancellation takes effect
    refund_amount,
    refund_status,
    created_at
FROM subscription_cancellations
ORDER BY cancelled_at DESC;

-- Sample query: Get cancellation statistics
SELECT 
    cancellation_reason,
    COUNT(*) as count,
    AVG(refund_amount) as avg_refund
FROM subscription_cancellations
GROUP BY cancellation_reason
ORDER BY count DESC;


-- ----------------------------------------------------------------------------
-- 6.2 SUBSCRIPTION MIGRATIONS
-- ----------------------------------------------------------------------------
-- Tracks plan upgrades/downgrades

SELECT 
    id,
    user_id,
    from_plan_id,
    to_plan_id,
    migration_type,        -- 'upgrade', 'downgrade', 'change'
    effective_date,
    proration_amount,      -- Credit/charge for plan change
    status,                -- 'pending', 'completed', 'failed'
    created_at,
    completed_at
FROM subscription_migrations
ORDER BY created_at DESC;

-- Sample query: Get migration history for a user
SELECT 
    sm.*,
    fp.name as from_plan_name,
    tp.name as to_plan_name
FROM subscription_migrations sm
JOIN subscription_plans fp ON sm.from_plan_id = fp.id
JOIN subscription_plans tp ON sm.to_plan_id = tp.id
WHERE sm.user_id = 'USER_ID_HERE'
ORDER BY sm.created_at DESC;


-- ============================================================================
-- SECTION 7: COMPREHENSIVE QUERIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7.1 Complete User Subscription Overview
-- ----------------------------------------------------------------------------
-- Get everything about a user's subscription status

SELECT 
    -- User subscription
    s.id as subscription_id,
    s.status as subscription_status,
    s.start_date,
    s.end_date,
    s.auto_renew,
    
    -- Plan details
    sp.name as plan_name,
    sp.price as plan_price,
    sp.billing_cycle,
    sp.plan_type,
    
    -- Active entitlements count
    (SELECT COUNT(*) FROM user_entitlements 
     WHERE user_id = s.user_id AND is_active = true) as active_entitlements_count,
    
    -- Addon purchases count
    (SELECT COUNT(*) FROM addon_events 
     WHERE user_id = s.user_id AND event_type = 'purchased') as addon_purchases_count,
    
    -- Total spent
    (SELECT COALESCE(SUM(amount), 0) FROM payment_transactions 
     WHERE user_id = s.user_id AND status = 'success') as total_spent

FROM subscriptions s
JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
WHERE s.user_id = 'USER_ID_HERE';


-- ----------------------------------------------------------------------------
-- 7.2 Available Addons for User's Plan
-- ----------------------------------------------------------------------------
-- Show addons that can be purchased for current plan

SELECT 
    spf.id,
    spf.feature_name,
    spf.feature_category,
    spf.description,
    spf.addon_price,
    
    -- Check if user already has this addon
    EXISTS (
        SELECT 1 FROM user_entitlements ue
        WHERE ue.user_id = 'USER_ID_HERE'
        AND ue.feature_id = spf.id
        AND ue.is_active = true
    ) as already_owned

FROM subscription_plan_features spf
WHERE spf.is_addon = true
ORDER BY spf.feature_category, spf.addon_price;


-- ----------------------------------------------------------------------------
-- 7.3 Revenue Analytics
-- ----------------------------------------------------------------------------
-- Analyze subscription and addon revenue

SELECT 
    DATE_TRUNC('month', created_at) as month,
    transaction_type,
    COUNT(*) as transaction_count,
    SUM(amount) as revenue,
    AVG(amount) as avg_transaction_value
FROM payment_transactions
WHERE status = 'success'
AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at), transaction_type
ORDER BY month DESC, transaction_type;


-- ----------------------------------------------------------------------------
-- 7.4 Subscription Health Metrics
-- ----------------------------------------------------------------------------
-- Key metrics for subscription business

SELECT 
    -- Active subscriptions
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
    
    -- Cancelled this month
    (SELECT COUNT(*) FROM subscription_cancellations 
     WHERE cancelled_at >= DATE_TRUNC('month', NOW())) as cancellations_this_month,
    
    -- New subscriptions this month
    (SELECT COUNT(*) FROM subscriptions 
     WHERE start_date >= DATE_TRUNC('month', NOW())) as new_subscriptions_this_month,
    
    -- Total MRR (Monthly Recurring Revenue)
    (SELECT SUM(sp.price) FROM subscriptions s
     JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
     WHERE s.status = 'active' AND sp.billing_cycle = 'monthly') as monthly_recurring_revenue,
    
    -- Addon revenue this month
    (SELECT COALESCE(SUM(amount), 0) FROM payment_transactions
     WHERE transaction_type = 'addon' 
     AND status = 'success'
     AND created_at >= DATE_TRUNC('month', NOW())) as addon_revenue_this_month;


-- ============================================================================
-- SECTION 8: COMMON USE CASES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 8.1 Purchase Addon Flow
-- ----------------------------------------------------------------------------
-- Steps to purchase an addon:

-- Step 1: Check if addon is available
SELECT * FROM subscription_plan_features
WHERE id = 'ADDON_ID_HERE' AND is_addon = true;

-- Step 2: Create pending order
INSERT INTO addon_pending_orders (user_id, addon_id, quantity, total_price, status)
VALUES ('USER_ID_HERE', 'ADDON_ID_HERE', 1, 999.00, 'pending')
RETURNING id;

-- Step 3: Create Razorpay order
INSERT INTO razorpay_orders (user_id, amount, currency, status, order_type, reference_id)
VALUES ('USER_ID_HERE', 999.00, 'INR', 'created', 'addon', 'PENDING_ORDER_ID')
RETURNING razorpay_order_id;

-- Step 4: After payment success, create entitlement
INSERT INTO user_entitlements (user_id, feature_id, source_type, source_id, is_active)
VALUES ('USER_ID_HERE', 'ADDON_ID_HERE', 'addon', 'PENDING_ORDER_ID', true);

-- Step 5: Record addon event
INSERT INTO addon_events (user_id, addon_id, event_type, event_data)
VALUES ('USER_ID_HERE', 'ADDON_ID_HERE', 'purchased', '{"order_id": "ORDER_ID"}');


-- ----------------------------------------------------------------------------
-- 8.2 Upgrade Subscription Plan
-- ----------------------------------------------------------------------------
-- Steps to upgrade a subscription:

-- Step 1: Get current subscription
SELECT * FROM subscriptions 
WHERE user_id = 'USER_ID_HERE' AND status = 'active';

-- Step 2: Calculate proration
-- (This would be done in application logic)

-- Step 3: Create migration record
INSERT INTO subscription_migrations 
(user_id, from_plan_id, to_plan_id, migration_type, proration_amount, status)
VALUES ('USER_ID_HERE', 'OLD_PLAN_ID', 'NEW_PLAN_ID', 'upgrade', 500.00, 'pending');

-- Step 4: Update subscription
UPDATE subscriptions 
SET subscription_plan_id = 'NEW_PLAN_ID',
    updated_at = NOW()
WHERE user_id = 'USER_ID_HERE' AND status = 'active';

-- Step 5: Update entitlements based on new plan
-- (This would involve removing old entitlements and adding new ones)


-- ----------------------------------------------------------------------------
-- 8.3 Check Feature Access
-- ----------------------------------------------------------------------------
-- Verify if user has access to a specific feature:

CREATE OR REPLACE FUNCTION check_user_feature_access(
    p_user_id UUID,
    p_feature_name TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_entitlements ue
        JOIN subscription_plan_features spf ON ue.feature_id = spf.id
        WHERE ue.user_id = p_user_id
        AND spf.feature_name = p_feature_name
        AND ue.is_active = true
        AND (ue.expires_at IS NULL OR ue.expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- Usage:
SELECT check_user_feature_access('USER_ID_HERE', 'advanced_analytics');


-- ============================================================================
-- SECTION 9: MAINTENANCE QUERIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 9.1 Expire Old Entitlements
-- ----------------------------------------------------------------------------
UPDATE user_entitlements
SET is_active = false
WHERE expires_at < NOW() AND is_active = true;


-- ----------------------------------------------------------------------------
-- 9.2 Auto-renew Subscriptions
-- ----------------------------------------------------------------------------
-- Find subscriptions due for renewal
SELECT 
    s.*,
    sp.name,
    sp.price
FROM subscriptions s
JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
WHERE s.status = 'active'
AND s.auto_renew = true
AND s.end_date <= NOW() + INTERVAL '7 days'
AND s.end_date > NOW();


-- ----------------------------------------------------------------------------
-- 9.3 Clean Up Expired Pending Orders
-- ----------------------------------------------------------------------------
UPDATE addon_pending_orders
SET status = 'cancelled'
WHERE status = 'pending'
AND created_at < NOW() - INTERVAL '24 hours';


-- ============================================================================
-- NOTES & BEST PRACTICES
-- ============================================================================

/*
ARCHITECTURE OVERVIEW:
----------------------
1. SUBSCRIPTION PLANS: Define what's available (B2B/B2C)
2. SUBSCRIPTIONS: Track user subscriptions
3. FEATURES: Normalized feature definitions (can be in plans or addons)
4. ENTITLEMENTS: What users actually have access to
5. BUNDLES: Grouped features at discounted prices
6. PAYMENTS: Razorpay integration for transactions

KEY CONCEPTS:
-------------
- Features can be part of plans OR sold as addons
- Entitlements are the source of truth for access control
- Bundles provide discounted feature packages
- All payments go through Razorpay
- Migrations track plan changes
- Cancellations can be immediate or end-of-period

COMMON PATTERNS:
----------------
1. Always check entitlements for feature access, not subscriptions directly
2. Use transactions for payment operations
3. Track all addon activity in addon_events
4. Maintain audit trail through created_at/updated_at
5. Use JSONB fields for flexible metadata storage

INTEGRATION POINTS:
-------------------
- Razorpay: Payment gateway integration
- User authentication: Links to users table
- Feature flags: Controlled through entitlements
- Analytics: Track through payment_transactions and addon_events
*/

-- ============================================================================
-- END OF SUBSCRIPTION SYSTEM OVERVIEW
-- ============================================================================
