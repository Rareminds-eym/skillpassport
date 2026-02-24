-- ============================================================================
-- RBAC SCHEMA - Tables, Indexes, Functions, Triggers, and Policies
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- 1.1 Create rbac_permissions table (no dependencies)
CREATE TABLE IF NOT EXISTS public.rbac_permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  permission_key character varying(100) NOT NULL,
  name character varying(255) NOT NULL,
  description text NULL,
  category character varying(50) NULL,
  action character varying(50) NOT NULL,
  subject character varying(100) NOT NULL,
  field character varying(100) NULL,
  icon character varying(50) NULL,
  sort_order integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT rbac_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT rbac_permissions_permission_key_key UNIQUE (permission_key)
);

-- 1.2 Create rbac_roles table (no dependencies)
CREATE TABLE IF NOT EXISTS public.rbac_roles (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  role_key character varying(100) NOT NULL,
  name character varying(255) NOT NULL,
  description text NULL,
  role_type character varying(50) NULL DEFAULT 'production'::character varying,
  is_active boolean NULL DEFAULT true,
  icon character varying(50) NULL,
  color character varying(50) NULL,
  sort_order integer NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT rbac_roles_pkey PRIMARY KEY (id),
  CONSTRAINT rbac_roles_role_key_key UNIQUE (role_key)
);

-- 1.3 Create rbac_role_permissions table (depends on rbac_permissions and rbac_roles)
CREATE TABLE IF NOT EXISTS public.rbac_role_permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  is_granted boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT rbac_role_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT rbac_role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id),
  CONSTRAINT rbac_role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES rbac_permissions (id) ON DELETE CASCADE,
  CONSTRAINT rbac_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES rbac_roles (id) ON DELETE CASCADE
);

-- 1.4 Create rbac_user_permissions table (depends on rbac_permissions)
CREATE TABLE IF NOT EXISTS public.rbac_user_permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  is_granted boolean NULL DEFAULT true,
  is_active boolean NULL DEFAULT true,
  expires_at timestamp with time zone NULL,
  assigned_by uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT rbac_user_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT rbac_user_permissions_user_id_permission_id_key UNIQUE (user_id, permission_id),
  CONSTRAINT rbac_user_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES rbac_permissions (id) ON DELETE CASCADE,
  CONSTRAINT rbac_user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 1.5 Create rbac_user_roles table (depends on rbac_roles)
CREATE TABLE IF NOT EXISTS public.rbac_user_roles (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  is_active boolean NULL DEFAULT true,
  expires_at timestamp with time zone NULL,
  assigned_by uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT rbac_user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT rbac_user_roles_user_id_role_id_key UNIQUE (user_id, role_id),
  CONSTRAINT rbac_user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES rbac_roles (id) ON DELETE CASCADE
);

-- 1.6 Create rbac_feature_usage table
CREATE TABLE IF NOT EXISTS public.rbac_feature_usage (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  feature_key character varying(100) NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  usage_limit integer NOT NULL DEFAULT -1, -- -1 means unlimited
  reset_period character varying(20) NULL DEFAULT 'monthly', -- daily, weekly, monthly, yearly, unlimited
  last_reset_at timestamp with time zone NULL DEFAULT now(),
  next_reset_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT rbac_feature_usage_pkey PRIMARY KEY (id),
  CONSTRAINT rbac_feature_usage_user_id_feature_key_key UNIQUE (user_id, feature_key),
  CONSTRAINT rbac_feature_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

-- Indexes for rbac_permissions
CREATE INDEX IF NOT EXISTS idx_rbac_permissions_action_subject ON public.rbac_permissions USING btree (action, subject);
CREATE INDEX IF NOT EXISTS idx_rbac_permissions_key ON public.rbac_permissions USING btree (permission_key);
CREATE INDEX IF NOT EXISTS idx_rbac_permissions_category ON public.rbac_permissions USING btree (category);

-- Indexes for rbac_roles
CREATE INDEX IF NOT EXISTS idx_rbac_roles_key ON public.rbac_roles USING btree (role_key);
CREATE INDEX IF NOT EXISTS idx_rbac_roles_active ON public.rbac_roles USING btree (is_active);

-- Indexes for rbac_role_permissions
CREATE INDEX IF NOT EXISTS idx_rbac_role_permissions_permission ON public.rbac_role_permissions USING btree (permission_id);
CREATE INDEX IF NOT EXISTS idx_rbac_role_permissions_role ON public.rbac_role_permissions USING btree (role_id);

-- Indexes for rbac_user_permissions
CREATE INDEX IF NOT EXISTS idx_rbac_user_permissions_user ON public.rbac_user_permissions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_user_permissions_permission ON public.rbac_user_permissions USING btree (permission_id);
CREATE INDEX IF NOT EXISTS idx_rbac_user_permissions_active ON public.rbac_user_permissions USING btree (user_id, is_active);

-- Indexes for rbac_user_roles
CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_user ON public.rbac_user_roles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_role ON public.rbac_user_roles USING btree (role_id);
CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_active ON public.rbac_user_roles USING btree (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_user_id ON public.rbac_user_roles USING btree (user_id);

-- Indexes for rbac_feature_usage
CREATE INDEX IF NOT EXISTS idx_rbac_feature_usage_user ON public.rbac_feature_usage USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_feature_usage_feature ON public.rbac_feature_usage USING btree (feature_key);
CREATE INDEX IF NOT EXISTS idx_rbac_feature_usage_user_feature ON public.rbac_feature_usage USING btree (user_id, feature_key);

-- ============================================================================
-- 3. CREATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE TRIGGER update_rbac_permissions_updated_at 
  BEFORE UPDATE ON rbac_permissions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_rbac_roles_updated_at 
  BEFORE UPDATE ON rbac_roles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_rbac_user_permissions_updated_at 
  BEFORE UPDATE ON rbac_user_permissions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_rbac_user_roles_updated_at 
  BEFORE UPDATE ON rbac_user_roles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. CREATE FUNCTIONS
-- ============================================================================

-- 4.1 Function: Get all permissions for a user
CREATE OR REPLACE FUNCTION public.rbac_get_user_permissions(p_user_id uuid)
RETURNS TABLE (
  permission_id uuid,
  permission_key character varying,
  name character varying,
  description text,
  category character varying,
  action character varying,
  subject character varying,
  field character varying,
  icon character varying,
  sort_order integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id as permission_id,
    p.permission_key,
    p.name,
    p.description,
    p.category,
    p.action,
    p.subject,
    p.field,
    p.icon,
    p.sort_order
  FROM rbac_permissions p
  WHERE p.id IN (
    -- Permissions from user roles
    SELECT rp.permission_id
    FROM rbac_user_roles ur
    JOIN rbac_role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND rp.is_granted = true
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
    
    UNION
    
    -- Direct user permissions
    SELECT up.permission_id
    FROM rbac_user_permissions up
    WHERE up.user_id = p_user_id
      AND up.is_active = true
      AND up.is_granted = true
      AND (up.expires_at IS NULL OR up.expires_at > now())
  )
  ORDER BY p.sort_order, p.permission_key;
END;
$;

-- 4.2 Function: Get usage status for a feature
CREATE OR REPLACE FUNCTION public.rbac_get_usage_status(
  p_user_id uuid,
  p_feature_key character varying
)
RETURNS TABLE (
  usage_count integer,
  usage_limit integer,
  remaining integer,
  reset_period character varying,
  next_reset_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  v_usage_count integer;
  v_usage_limit integer;
  v_reset_period character varying;
  v_last_reset_at timestamp with time zone;
  v_next_reset_at timestamp with time zone;
BEGIN
  -- Get current usage record
  SELECT 
    fu.usage_count,
    fu.usage_limit,
    fu.reset_period,
    fu.last_reset_at
  INTO 
    v_usage_count,
    v_usage_limit,
    v_reset_period,
    v_last_reset_at
  FROM rbac_feature_usage fu
  WHERE fu.user_id = p_user_id
    AND fu.feature_key = p_feature_key;

  -- If no record exists, return unlimited
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, -1, -1, 'unlimited'::character varying, NULL::timestamp with time zone;
    RETURN;
  END IF;

  -- Calculate next reset time based on period
  CASE v_reset_period
    WHEN 'daily' THEN
      v_next_reset_at := v_last_reset_at + interval '1 day';
    WHEN 'weekly' THEN
      v_next_reset_at := v_last_reset_at + interval '1 week';
    WHEN 'monthly' THEN
      v_next_reset_at := v_last_reset_at + interval '1 month';
    WHEN 'yearly' THEN
      v_next_reset_at := v_last_reset_at + interval '1 year';
    ELSE
      v_next_reset_at := NULL;
  END CASE;

  -- Return usage status
  RETURN QUERY SELECT 
    v_usage_count,
    v_usage_limit,
    CASE 
      WHEN v_usage_limit = -1 THEN -1
      ELSE GREATEST(0, v_usage_limit - v_usage_count)
    END,
    v_reset_period,
    v_next_reset_at;
END;
$;

-- 4.3 Function: Check and increment usage
CREATE OR REPLACE FUNCTION public.rbac_check_and_increment_usage(
  p_user_id uuid,
  p_feature_key character varying
)
RETURNS TABLE (
  allowed boolean,
  usage_count integer,
  usage_limit integer,
  remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  v_usage_count integer;
  v_usage_limit integer;
  v_reset_period character varying;
  v_last_reset_at timestamp with time zone;
  v_should_reset boolean := false;
BEGIN
  -- Get current usage record
  SELECT 
    fu.usage_count,
    fu.usage_limit,
    fu.reset_period,
    fu.last_reset_at
  INTO 
    v_usage_count,
    v_usage_limit,
    v_reset_period,
    v_last_reset_at
  FROM rbac_feature_usage fu
  WHERE fu.user_id = p_user_id
    AND fu.feature_key = p_feature_key;

  -- If no record exists, allow unlimited usage
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, 0, -1, -1;
    RETURN;
  END IF;

  -- Check if usage should be reset based on period
  CASE v_reset_period
    WHEN 'daily' THEN
      v_should_reset := v_last_reset_at + interval '1 day' <= now();
    WHEN 'weekly' THEN
      v_should_reset := v_last_reset_at + interval '1 week' <= now();
    WHEN 'monthly' THEN
      v_should_reset := v_last_reset_at + interval '1 month' <= now();
    WHEN 'yearly' THEN
      v_should_reset := v_last_reset_at + interval '1 year' <= now();
    ELSE
      v_should_reset := false;
  END CASE;

  -- Reset usage if needed
  IF v_should_reset THEN
    UPDATE rbac_feature_usage
    SET 
      usage_count = 0,
      last_reset_at = now(),
      updated_at = now()
    WHERE user_id = p_user_id
      AND feature_key = p_feature_key;
    
    v_usage_count := 0;
  END IF;

  -- Check if usage is allowed
  IF v_usage_limit = -1 OR v_usage_count < v_usage_limit THEN
    -- Increment usage
    UPDATE rbac_feature_usage
    SET 
      usage_count = usage_count + 1,
      updated_at = now()
    WHERE user_id = p_user_id
      AND feature_key = p_feature_key;
    
    v_usage_count := v_usage_count + 1;
    
    RETURN QUERY SELECT 
      true,
      v_usage_count,
      v_usage_limit,
      CASE 
        WHEN v_usage_limit = -1 THEN -1
        ELSE GREATEST(0, v_usage_limit - v_usage_count)
      END;
  ELSE
    -- Usage limit reached
    RETURN QUERY SELECT 
      false,
      v_usage_count,
      v_usage_limit,
      0;
  END IF;
END;
$;

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.rbac_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rbac_feature_usage ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.rbac_user_roles;
DROP POLICY IF EXISTS "Service role can manage all roles" ON public.rbac_user_roles;
DROP POLICY IF EXISTS "Users can view their own usage" ON public.rbac_feature_usage;
DROP POLICY IF EXISTS "Users can update their own usage" ON public.rbac_feature_usage;

-- RLS Policies for rbac_user_roles
CREATE POLICY "Users can view their own roles"
  ON public.rbac_user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all roles"
  ON public.rbac_user_roles
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for rbac_feature_usage
CREATE POLICY "Users can view their own usage"
  ON public.rbac_feature_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON public.rbac_feature_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. ENABLE REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.rbac_user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rbac_feature_usage;
