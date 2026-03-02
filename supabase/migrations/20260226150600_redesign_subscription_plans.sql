-- ============================================================================
-- SUBSCRIPTION PLANS REDESIGN - MINIMAL INDUSTRIAL GRADE SCHEMA
-- ============================================================================

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS subscription_plans_backup AS 
SELECT * FROM subscription_plans;

-- Step 2: Create new optimized table structure (minimal columns)
CREATE TABLE subscription_plans_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code text NOT NULL UNIQUE,
  name text NOT NULL,
  business_type text NOT NULL CHECK (business_type IN ('b2b', 'b2c')),
  applicable_entities text[] NOT NULL DEFAULT '{}',
  pricing_matrix jsonb NOT NULL DEFAULT '{}'::jsonb,
  base_features jsonb DEFAULT '[]'::jsonb,
  entity_config jsonb DEFAULT '{}'::jsonb,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Create indexes
CREATE INDEX idx_subscription_plans_new_plan_code ON subscription_plans_new(plan_code);
CREATE INDEX idx_subscription_plans_new_business_type ON subscription_plans_new(business_type);
CREATE INDEX idx_subscription_plans_new_is_active ON subscription_plans_new(is_active);
CREATE INDEX idx_subscription_plans_new_pricing_matrix ON subscription_plans_new USING gin(pricing_matrix);
CREATE INDEX idx_subscription_plans_new_entity_config ON subscription_plans_new USING gin(entity_config);
CREATE INDEX idx_subscription_plans_new_applicable_entities ON subscription_plans_new USING gin(applicable_entities);

-- Step 4: Insert B2B plans
INSERT INTO subscription_plans_new (
  plan_code, name, business_type, applicable_entities,
  pricing_matrix, base_features, entity_config, display_order, is_active
) VALUES 
(
  'basic',
  'Basic',
  'b2b',
  ARRAY['school', 'college', 'university'],
  '{
    "school": {"monthly": 200, "yearly": 2000, "currency": "INR"},
    "college": {"monthly": 250, "yearly": 2500, "currency": "INR"},
    "university": {"monthly": 350, "yearly": 3500, "currency": "INR"}
  }'::jsonb,
  '["Basic assessments", "Standard reports", "Email support"]'::jsonb,
  '{
    "school": {
      "max_users": 500,
      "max_admins": 2,
      "storage_limit": "10GB",
      "display_name": "School Basic",
      "description": "Essential tools for small schools to manage students and track progress",
      "tagline": "Essential tools for getting started",
      "positioning": "Ideal for individuals, small teams, and pilots",
      "color": "bg-slate-600",
      "ideal_for": "Small schools",
      "is_recommended": false,
      "additional_features": ["Parent portal access"]
    },
    "college": {
      "max_users": 1000,
      "max_admins": 3,
      "storage_limit": "20GB",
      "display_name": "College Basic",
      "description": "Essential tools for small colleges and autonomous institutions",
      "tagline": "Essential tools for getting started",
      "positioning": "Ideal for small colleges",
      "color": "bg-slate-600",
      "ideal_for": "Small colleges",
      "is_recommended": false,
      "additional_features": ["Career guidance tools", "Department management"]
    },
    "university": {
      "max_users": 2000,
      "max_admins": 5,
      "storage_limit": "50GB",
      "display_name": "University Basic",
      "description": "Essential tools for university departments and affiliated colleges",
      "tagline": "Essential tools for getting started",
      "positioning": "Ideal for university departments",
      "color": "bg-slate-600",
      "ideal_for": "University departments",
      "is_recommended": false,
      "additional_features": ["Department-level management", "Multi-department view", "Research tracking basics"]
    }
  }'::jsonb,
  1,
  true
),
(
  'professional',
  'Professional',
  'b2b',
  ARRAY['school', 'college', 'university'],
  '{
    "school": {"monthly": 350, "yearly": 3500, "currency": "INR"},
    "college": {"monthly": 450, "yearly": 4500, "currency": "INR"},
    "university": {"monthly": 600, "yearly": 6000, "currency": "INR"}
  }'::jsonb,
  '["Advanced assessments", "Analytics dashboard", "Priority support", "Custom branding"]'::jsonb,
  '{
    "school": {
      "max_users": 1500,
      "max_admins": 5,
      "storage_limit": "50GB",
      "display_name": "School Professional",
      "description": "Advanced features for growing schools with enhanced analytics and support",
      "tagline": "Advanced features for growing institutions",
      "positioning": "Ideal for growing organizations and L&D teams",
      "color": "bg-slate-600",
      "ideal_for": "Growing schools",
      "is_recommended": true,
      "additional_features": ["Parent portal", "Teacher collaboration tools"]
    },
    "college": {
      "max_users": 3000,
      "max_admins": 10,
      "storage_limit": "100GB",
      "display_name": "College Professional",
      "description": "Advanced features for growing colleges with placement and analytics focus",
      "tagline": "Advanced features for growing institutions",
      "positioning": "Ideal for growing colleges",
      "color": "bg-slate-600",
      "ideal_for": "Growing colleges",
      "is_recommended": true,
      "additional_features": ["Placement management", "Enhanced analytics", "Industry connect portal", "Alumni network tools", "Training & internship tracking"]
    },
    "university": {
      "max_users": 5000,
      "max_admins": 15,
      "storage_limit": "200GB",
      "display_name": "University Professional",
      "description": "Advanced features for universities with comprehensive academic management",
      "tagline": "Advanced features for growing institutions",
      "positioning": "Ideal for universities",
      "color": "bg-slate-600",
      "ideal_for": "Universities",
      "is_recommended": true,
      "additional_features": ["Multi-department management", "Research collaboration tools", "Enhanced analytics & insights", "Industry connect", "Placement management", "Alumni network", "Accreditation tracking"]
    }
  }'::jsonb,
  2,
  true
),
(
  'enterprise',
  'Enterprise',
  'b2b',
  ARRAY['school', 'college', 'university'],
  '{
    "school": {"monthly": 500, "yearly": 5000, "currency": "INR"},
    "college": {"monthly": 650, "yearly": 6500, "currency": "INR"},
    "university": {"monthly": 900, "yearly": 9000, "currency": "INR"}
  }'::jsonb,
  '["All Professional features", "White-label solution", "API access", "Dedicated account manager", "24/7 phone support", "Advanced integrations"]'::jsonb,
  '{
    "school": {
      "max_users": 5000,
      "max_admins": 20,
      "storage_limit": "500GB",
      "display_name": "School Enterprise",
      "description": "Comprehensive solution for large school chains with unlimited capabilities",
      "tagline": "Comprehensive solution for large institutions",
      "positioning": "Ideal for large organizations with multi-department rollout",
      "color": "bg-slate-600",
      "ideal_for": "Large school chains",
      "is_recommended": false,
      "additional_features": ["Custom workflows"]
    },
    "college": {
      "max_users": 10000,
      "max_admins": 30,
      "storage_limit": "1TB",
      "display_name": "College Enterprise",
      "description": "Comprehensive solution for large colleges and university affiliates",
      "tagline": "Comprehensive solution for large institutions",
      "positioning": "Ideal for large colleges",
      "color": "bg-slate-600",
      "ideal_for": "Large colleges",
      "is_recommended": false,
      "additional_features": ["Multi-campus support", "Research collaboration tools", "Accreditation reporting"]
    },
    "university": {
      "max_users": 15000,
      "max_admins": 50,
      "storage_limit": "2TB",
      "display_name": "University Enterprise",
      "description": "Comprehensive solution for large universities with multi-campus needs",
      "tagline": "Comprehensive solution for large institutions",
      "positioning": "Ideal for large universities",
      "color": "bg-slate-600",
      "ideal_for": "Large universities",
      "is_recommended": false,
      "additional_features": ["Multi-campus management", "Custom reporting", "White-label options", "Research grants management", "International collaboration tools"]
    }
  }'::jsonb,
  3,
  true
),
(
  'ecosystem',
  'Ecosystem',
  'b2b',
  ARRAY['school', 'college', 'university'],
  '{
    "school": {"monthly": 0, "yearly": 0, "currency": "INR"},
    "college": {"monthly": 0, "yearly": 0, "currency": "INR"},
    "university": {"monthly": 0, "yearly": 0, "currency": "INR"}
  }'::jsonb,
  '["Unlimited students", "All Enterprise features", "Multi-region support", "Custom SLA", "Dedicated infrastructure", "Bespoke development", "Strategic consulting"]'::jsonb,
  '{
    "school": {
      "max_users": null,
      "max_admins": null,
      "storage_limit": "Unlimited",
      "display_name": "School Ecosystem",
      "description": "Custom enterprise solution for large educational groups with specific needs",
      "tagline": "Custom enterprise solution",
      "positioning": "Ideal for large enterprises and regulated organizations",
      "color": "bg-slate-600",
      "ideal_for": "Large educational groups",
      "is_recommended": false,
      "additional_features": []
    },
    "college": {
      "max_users": null,
      "max_admins": null,
      "storage_limit": "Unlimited",
      "display_name": "College Ecosystem",
      "description": "Custom enterprise solution for educational groups with specific requirements",
      "tagline": "Custom enterprise solution",
      "positioning": "Ideal for large college groups",
      "color": "bg-slate-600",
      "ideal_for": "Educational groups",
      "is_recommended": false,
      "additional_features": ["AI-powered analytics"]
    },
    "university": {
      "max_users": null,
      "max_admins": null,
      "storage_limit": "Unlimited",
      "display_name": "University Ecosystem",
      "description": "Custom enterprise solution for university systems and state education networks",
      "tagline": "Custom enterprise solution",
      "positioning": "Ideal for university systems",
      "color": "bg-slate-600",
      "ideal_for": "University systems",
      "is_recommended": false,
      "additional_features": ["AI-powered analytics", "Data sovereignty options", "Enterprise SSO & security"]
    }
  }'::jsonb,
  4,
  true
);

-- Step 5: Insert B2C plans
INSERT INTO subscription_plans_new (
  plan_code, name, business_type, applicable_entities,
  pricing_matrix, base_features, entity_config, display_order, is_active
) VALUES 
(
  'basic_individual',
  'Basic',
  'b2c',
  ARRAY['all'],
  '{
    "all": {"monthly": 499, "yearly": 4999, "currency": "INR"}
  }'::jsonb,
  '["access_basic_assessments", "skill_analytics", "portfolio_builder", "basic_support", "5_assessments_month", "3_projects", "5GB_storage"]'::jsonb,
  '{
    "all": {
      "max_users": 1,
      "display_name": "Basic",
      "description": "Essential tools for individual learning and skill development",
      "tagline": "Essential tools for individual learning",
      "positioning": "Ideal for individuals",
      "color": "bg-slate-600",
      "ideal_for": "Individual learners",
      "is_recommended": false
    }
  }'::jsonb,
  1,
  true
),
(
  'professional_individual',
  'Professional',
  'b2c',
  ARRAY['all'],
  '{
    "all": {"monthly": 749, "yearly": 7499, "currency": "INR"}
  }'::jsonb,
  '["access_all_assessments", "advanced_skill_analytics", "portfolio_builder", "career_pathways", "interview_prep", "priority_support", "certificate_access", "job_board_access", "20_assessments_month", "10_projects", "20GB_storage", "resume_builder"]'::jsonb,
  '{
    "all": {
      "max_users": 1,
      "display_name": "Professional",
      "description": "Advanced features for serious learners and career builders",
      "tagline": "Advanced features for serious learners",
      "positioning": "Ideal for career builders",
      "color": "bg-slate-600",
      "ideal_for": "Career builders",
      "is_recommended": true
    }
  }'::jsonb,
  2,
  true
),
(
  'premium',
  'Premium',
  'b2c',
  ARRAY['all'],
  '{
    "all": {"monthly": 999, "yearly": 9999, "currency": "INR"}
  }'::jsonb,
  '["access_all_assessments", "premium_skill_analytics", "advanced_portfolio", "all_career_pathways", "mock_interviews", "1_on_1_mentorship", "priority_support", "verified_certificates", "premium_job_board", "unlimited_assessments", "unlimited_projects", "50GB_storage", "resume_builder", "linkedIn_optimization", "placement_assistance"]'::jsonb,
  '{
    "all": {
      "max_users": 1,
      "display_name": "Premium",
      "description": "Complete toolkit for maximum career success and placement readiness",
      "tagline": "Complete toolkit for maximum career success",
      "positioning": "Ideal for placement readiness",
      "color": "bg-slate-600",
      "ideal_for": "Job seekers",
      "is_recommended": false
    }
  }'::jsonb,
  3,
  true
);

-- Step 6: Create helper functions
CREATE OR REPLACE FUNCTION get_plan_for_entity(
  p_plan_code text,
  p_entity_type text
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'plan_code', plan_code,
    'name', COALESCE(entity_config->p_entity_type->>'display_name', name),
    'description', entity_config->p_entity_type->>'description',
    'tagline', entity_config->p_entity_type->>'tagline',
    'positioning', entity_config->p_entity_type->>'positioning',
    'color', entity_config->p_entity_type->>'color',
    'ideal_for', entity_config->p_entity_type->>'ideal_for',
    'is_recommended', (entity_config->p_entity_type->>'is_recommended')::boolean,
    'price_monthly', (pricing_matrix->p_entity_type->>'monthly')::integer,
    'price_yearly', (pricing_matrix->p_entity_type->>'yearly')::integer,
    'currency', COALESCE(pricing_matrix->p_entity_type->>'currency', 'INR'),
    'max_users', (entity_config->p_entity_type->>'max_users')::integer,
    'max_admins', (entity_config->p_entity_type->>'max_admins')::integer,
    'storage_limit', entity_config->p_entity_type->>'storage_limit',
    'features', base_features || COALESCE(entity_config->p_entity_type->'additional_features', '[]'::jsonb),
    'display_order', display_order,
    'is_active', is_active
  ) INTO result
  FROM subscription_plans_new
  WHERE plan_code = p_plan_code
    AND p_entity_type = ANY(applicable_entities)
    AND is_active = true;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_all_plans_for_entity(
  p_entity_type text
) RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'plan_code', plan_code,
        'name', COALESCE(entity_config->p_entity_type->>'display_name', name),
        'description', entity_config->p_entity_type->>'description',
        'tagline', entity_config->p_entity_type->>'tagline',
        'positioning', entity_config->p_entity_type->>'positioning',
        'color', entity_config->p_entity_type->>'color',
        'ideal_for', entity_config->p_entity_type->>'ideal_for',
        'is_recommended', (entity_config->p_entity_type->>'is_recommended')::boolean,
        'price_monthly', (pricing_matrix->p_entity_type->>'monthly')::integer,
        'price_yearly', (pricing_matrix->p_entity_type->>'yearly')::integer,
        'currency', COALESCE(pricing_matrix->p_entity_type->>'currency', 'INR'),
        'max_users', (entity_config->p_entity_type->>'max_users')::integer,
        'max_admins', (entity_config->p_entity_type->>'max_admins')::integer,
        'storage_limit', entity_config->p_entity_type->>'storage_limit',
        'features', base_features || COALESCE(entity_config->p_entity_type->'additional_features', '[]'::jsonb),
        'display_order', display_order
      ) ORDER BY display_order
    )
    FROM subscription_plans_new
    WHERE p_entity_type = ANY(applicable_entities)
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- Step 7: Update trigger
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_plans_new_updated_at
  BEFORE UPDATE ON subscription_plans_new
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();
