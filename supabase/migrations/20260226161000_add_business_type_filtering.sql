-- Add business_type parameter to helper functions for proper B2B/B2C filtering

DROP FUNCTION IF EXISTS get_plan_for_entity(text, text);
DROP FUNCTION IF EXISTS get_all_plans_for_entity(text);

-- Updated get_plan_for_entity with business_type parameter
CREATE OR REPLACE FUNCTION get_plan_for_entity(
  p_plan_code text,
  p_entity_type text DEFAULT 'all',
  p_business_type text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'plan_code', plan_code,
    'business_type', business_type,
    'name', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'display_name', entity_config->'all'->>'display_name', name),
    'description', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'description', entity_config->'all'->>'description'),
    'tagline', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'tagline', entity_config->'all'->>'tagline'),
    'positioning', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'positioning', entity_config->'all'->>'positioning'),
    'color', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'color', entity_config->'all'->>'color'),
    'ideal_for', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'ideal_for', entity_config->'all'->>'ideal_for'),
    'is_recommended', COALESCE((entity_config->COALESCE(p_entity_type, 'all')->>'is_recommended')::boolean, (entity_config->'all'->>'is_recommended')::boolean),
    'price_monthly', COALESCE((pricing_matrix->COALESCE(p_entity_type, 'all')->>'monthly')::integer, (pricing_matrix->'all'->>'monthly')::integer),
    'price_yearly', COALESCE((pricing_matrix->COALESCE(p_entity_type, 'all')->>'yearly')::integer, (pricing_matrix->'all'->>'yearly')::integer),
    'currency', COALESCE(pricing_matrix->COALESCE(p_entity_type, 'all')->>'currency', pricing_matrix->'all'->>'currency', 'INR'),
    'max_users', COALESCE((entity_config->COALESCE(p_entity_type, 'all')->>'max_users')::integer, (entity_config->'all'->>'max_users')::integer),
    'max_admins', COALESCE((entity_config->COALESCE(p_entity_type, 'all')->>'max_admins')::integer, (entity_config->'all'->>'max_admins')::integer),
    'storage_limit', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'storage_limit', entity_config->'all'->>'storage_limit'),
    'features', base_features || COALESCE(entity_config->COALESCE(p_entity_type, 'all')->'additional_features', entity_config->'all'->'additional_features', '[]'::jsonb),
    'display_order', display_order,
    'is_active', is_active
  ) INTO result
  FROM subscription_plans
  WHERE plan_code = p_plan_code
    AND (p_entity_type = ANY(applicable_entities) OR 'all' = ANY(applicable_entities))
    AND (p_business_type IS NULL OR business_type = p_business_type)
    AND is_active = true;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Updated get_all_plans_for_entity with business_type parameter
CREATE OR REPLACE FUNCTION get_all_plans_for_entity(
  p_entity_type text DEFAULT 'all',
  p_business_type text DEFAULT NULL
) RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'plan_code', plan_code,
        'business_type', business_type,
        'name', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'display_name', entity_config->'all'->>'display_name', name),
        'description', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'description', entity_config->'all'->>'description'),
        'tagline', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'tagline', entity_config->'all'->>'tagline'),
        'positioning', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'positioning', entity_config->'all'->>'positioning'),
        'color', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'color', entity_config->'all'->>'color'),
        'ideal_for', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'ideal_for', entity_config->'all'->>'ideal_for'),
        'is_recommended', COALESCE((entity_config->COALESCE(p_entity_type, 'all')->>'is_recommended')::boolean, (entity_config->'all'->>'is_recommended')::boolean),
        'price_monthly', COALESCE((pricing_matrix->COALESCE(p_entity_type, 'all')->>'monthly')::integer, (pricing_matrix->'all'->>'monthly')::integer),
        'price_yearly', COALESCE((pricing_matrix->COALESCE(p_entity_type, 'all')->>'yearly')::integer, (pricing_matrix->'all'->>'yearly')::integer),
        'currency', COALESCE(pricing_matrix->COALESCE(p_entity_type, 'all')->>'currency', pricing_matrix->'all'->>'currency', 'INR'),
        'max_users', COALESCE((entity_config->COALESCE(p_entity_type, 'all')->>'max_users')::integer, (entity_config->'all'->>'max_users')::integer),
        'max_admins', COALESCE((entity_config->COALESCE(p_entity_type, 'all')->>'max_admins')::integer, (entity_config->'all'->>'max_admins')::integer),
        'storage_limit', COALESCE(entity_config->COALESCE(p_entity_type, 'all')->>'storage_limit', entity_config->'all'->>'storage_limit'),
        'features', base_features || COALESCE(entity_config->COALESCE(p_entity_type, 'all')->'additional_features', entity_config->'all'->'additional_features', '[]'::jsonb),
        'display_order', display_order
      ) ORDER BY display_order
    )
    FROM subscription_plans
    WHERE (p_entity_type = ANY(applicable_entities) OR 'all' = ANY(applicable_entities))
      AND (p_business_type IS NULL OR business_type = p_business_type)
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;
