-- Migration: Add unique constraints on razorpay_order_id to prevent replay attacks and duplicate payments
-- This forces the database to reject a second record with the same order ID.

-- 1. Pre-registrations (created via create-registration-order.ts)
ALTER TABLE public.pre_registrations 
ADD CONSTRAINT pre_registrations_razorpay_order_id_key UNIQUE (razorpay_order_id);

-- 2. User Entitlements (created via verify-addon-payment.ts / verify-bundle-payment.ts)
-- We use razorpay_subscription_id here as the column name (used for both subs and orders)
ALTER TABLE public.user_entitlements 
ADD CONSTRAINT user_entitlements_razorpay_subscription_id_key UNIQUE (razorpay_subscription_id);

-- Note: The SSO Worker handles idempotency for core subscriptions and transactions directly.
