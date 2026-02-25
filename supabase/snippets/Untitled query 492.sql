SELECT plan_code, name, price_monthly, price_yearly, business_type, entity_type, role_type
FROM subscription_plans
WHERE is_active = true
ORDER BY display_order;