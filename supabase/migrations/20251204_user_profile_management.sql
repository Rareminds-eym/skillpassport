-- =====================================================
-- USER & PROFILE MANAGEMENT SYSTEM
-- =====================================================

-- User Profiles Extended (additional profile data beyond auth.users)
CREATE TABLE IF NOT EXISTS user_profiles_extended (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Personal Information
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    blood_group VARCHAR(10),
    nationality VARCHAR(100) DEFAULT 'Indian',
    religion VARCHAR(100),
    category VARCHAR(50), -- General, OBC, SC, ST, etc.
    
    -- Contact Information
    phone_primary VARCHAR(20),
    phone_secondary VARCHAR(20),
    email_secondary VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(100),
    
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    pincode VARCHAR(20),
    
    -- Professional Information (for faculty/staff)
    employee_id VARCHAR(100),
    designation VARCHAR(200),
    department VARCHAR(200),
    specialization TEXT,
    qualification VARCHAR(500),
    experience_years INTEGER,
    date_of_joining DATE,
    
    -- Student Information
    enrollment_number VARCHAR(100),
    roll_number VARCHAR(100),
    batch VARCHAR(50),
    semester INTEGER,
    section VARCHAR(10),
    current_cgpa NUMERIC(4, 2),
    
    -- Documents
    photo_url TEXT,
    resume_url TEXT,
    id_proof_url TEXT,
    address_proof_url TEXT,
    documents JSONB DEFAULT '[]', -- Array of {type, name, url, uploaded_at}
    
    -- Social Links
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    other_links JSONB DEFAULT '{}',
    
    -- Preferences
    preferences JSONB DEFAULT '{}', -- UI preferences, notification settings, etc.
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    
    -- Metadata
    bio TEXT,
    skills JSONB DEFAULT '[]',
    interests JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- User Role Assignments (for multi-role support)
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    scope_type VARCHAR(50), -- 'college', 'department', 'program', 'global'
    scope_id UUID, -- ID of college, department, etc.
    is_primary BOOLEAN DEFAULT FALSE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, role, scope_type, scope_id)
);

-- User Activity Log
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- 'login', 'logout', 'profile_update', 'password_change', etc.
    activity_description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Sessions (for tracking active sessions)
CREATE TABLE IF NOT EXISTS user_sessions_extended (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Permissions (granular permissions beyond roles)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_key VARCHAR(200) NOT NULL, -- e.g., 'circulars.create', 'students.delete'
    resource_type VARCHAR(100), -- 'circular', 'student', 'exam', etc.
    resource_id UUID, -- Specific resource ID if applicable
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, permission_key, resource_type, resource_id)
);

-- User Bulk Import History
CREATE TABLE IF NOT EXISTS user_bulk_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imported_by UUID NOT NULL REFERENCES users(id),
    file_name VARCHAR(500),
    file_url TEXT,
    total_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'partial')),
    error_log JSONB DEFAULT '[]',
    import_type VARCHAR(100), -- 'students', 'faculty', 'staff'
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles_extended(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles_extended(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_enrollment_number ON user_profiles_extended(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role ON user_role_assignments(role);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_scope ON user_role_assignments(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions_extended(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions_extended(session_token);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_key ON user_permissions(permission_key);

-- RLS Policies
ALTER TABLE user_profiles_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bulk_imports ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles_extended
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles_extended
    FOR UPDATE USING (user_id = auth.uid());

-- Admins can manage all profiles
CREATE POLICY "Admins can manage profiles" ON user_profiles_extended
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('super_admin', 'college_admin', 'school_admin')
        )
    );

-- Role assignments: Admins can manage
CREATE POLICY "Admins can manage role assignments" ON user_role_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('super_admin', 'college_admin')
        )
    );

-- Users can view their own role assignments
CREATE POLICY "Users can view own roles" ON user_role_assignments
    FOR SELECT USING (user_id = auth.uid());

-- Activity log: Users can view their own activity
CREATE POLICY "Users can view own activity" ON user_activity_log
    FOR SELECT USING (user_id = auth.uid());

-- Admins can view all activity
CREATE POLICY "Admins can view all activity" ON user_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('super_admin', 'college_admin')
        )
    );

-- Sessions: Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions_extended
    FOR SELECT USING (user_id = auth.uid());

-- Permissions: Users can view their own permissions
CREATE POLICY "Users can view own permissions" ON user_permissions
    FOR SELECT USING (user_id = auth.uid());

-- Bulk imports: Only admins can view
CREATE POLICY "Admins can view bulk imports" ON user_bulk_imports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('super_admin', 'college_admin')
        )
    );

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_activity_log (user_id, activity_type, activity_description, metadata)
    VALUES (p_user_id, p_activity_type, p_description, p_metadata);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_permission_key VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_id = p_user_id
        AND permission_key = p_permission_key
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's active roles
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TABLE (
    role VARCHAR,
    scope_type VARCHAR,
    scope_id UUID,
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ura.role,
        ura.scope_type,
        ura.scope_id,
        ura.is_primary
    FROM user_role_assignments ura
    WHERE ura.user_id = p_user_id
    AND ura.is_active = TRUE
    AND (ura.valid_from IS NULL OR ura.valid_from <= NOW())
    AND (ura.valid_until IS NULL OR ura.valid_until > NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to deactivate expired sessions
CREATE OR REPLACE FUNCTION deactivate_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE user_sessions_extended
    SET is_active = FALSE
    WHERE expires_at < NOW()
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles_extended
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Trigger to log profile updates
CREATE OR REPLACE FUNCTION log_profile_update()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_user_activity(
        NEW.user_id,
        'profile_update',
        'User profile updated',
        jsonb_build_object('updated_fields', to_jsonb(NEW) - to_jsonb(OLD))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profile_update_log
    AFTER UPDATE ON user_profiles_extended
    FOR EACH ROW
    EXECUTE FUNCTION log_profile_update();

COMMENT ON TABLE user_profiles_extended IS 'Extended user profile information beyond basic auth data';
COMMENT ON TABLE user_role_assignments IS 'Multi-role support with scope-based assignments';
COMMENT ON TABLE user_activity_log IS 'Audit trail of user activities';
COMMENT ON TABLE user_sessions_extended IS 'Active user session tracking';
COMMENT ON TABLE user_permissions IS 'Granular permission assignments';
COMMENT ON TABLE user_bulk_imports IS 'History of bulk user imports';
