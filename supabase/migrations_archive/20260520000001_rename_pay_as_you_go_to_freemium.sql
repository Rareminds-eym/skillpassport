-- Rename pay_as_you_go to freemium in existing records
-- This ensures the data matches the new freemium terminology before the cross-db migration

UPDATE public.subscription_plans
SET plan_code = 'freemium'
WHERE plan_code = 'pay_as_you_go';

UPDATE public.subscriptions
SET plan_type = 'freemium'
WHERE plan_type = 'pay_as_you_go';

UPDATE public.plans_cache
SET plan_code = 'freemium'
WHERE plan_code = 'pay_as_you_go';

UPDATE public.subscription_cache
SET plan_code = 'freemium'
WHERE plan_code = 'pay_as_you_go';
