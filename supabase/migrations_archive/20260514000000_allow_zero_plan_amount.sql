-- Migration: Allow Zero Plan Amount for Freemium
-- Description: Modify check constraint to allow ₹0 for freemium plans
-- Date: 2026-05-14

-- Drop the old constraint that requires plan_amount > 0
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS check_plan_amount_positive;

-- Add new constraint that allows plan_amount >= 0 (including zero for freemium)
ALTER TABLE public.subscriptions 
ADD CONSTRAINT check_plan_amount_non_negative 
CHECK (plan_amount >= 0);

-- Update comment
COMMENT ON CONSTRAINT check_plan_amount_non_negative ON public.subscriptions 
IS 'Ensures plan amount is non-negative (allows ₹0 for freemium plans)';
