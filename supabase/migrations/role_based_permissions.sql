-- Role-Based Permission System for Teacher Management
-- Implements the permission matrix: Principal, IT Admin, Class Teacher, Subject Teacher

-- Add role column to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'subject_teacher' 
CHECK (role IN ('school_admin', 'principal', 'it_admin', 'class_teacher', 'subject_teacher'));

-- Add role column to school_educators table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'school_educators') THEN
    ALTER TABLE school_educators 
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'subject_teacher' 
    CHECK (role IN ('school_admin', 'principal', 'it_admin', 'class_teacher', 'subject_teacher'));
  END IF;
END $$;

-- Create permissions table to track role-based access
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(20) NOT NULL CHECK (role IN ('school_admin', 'principal', 'it_admin', 'class_teacher', 'subject_teacher')),
  feature VARCHAR(50) NOT NULL, -- 'add_teacher', 'assign_classes', 'timetable_editing'
  permission_level VARCHAR(10) NOT NULL CHECK (permission_level IN ('C', 'A', 'U', 'V', 'N/A')),
  -- C = Create, A = Approve, U = Update, V = View, N/A = No Access
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role, feature)
);

-- Insert permission matrix from reference image
INSERT INTO role_permissions (role, feature, permission_level) VALUES
-- School Admin permissions (Full Access - same as Principal)
('school_admin', 'add_teacher', 'C/A'),
('school_admin', 'assign_classes', 'A'),
('school_admin', 'timetable_editing', 'A'),

-- Principal permissions
('principal', 'add_teacher', 'C/A'),
('principal', 'assign_classes', 'A'),
('principal', 'timetable_editing', 'A'),

-- IT Admin permissions
('it_admin', 'add_teacher', 'C'),
('it_admin', 'assign_classes', 'C'),
('it_admin', 'timetable_editing', 'U'),

-- Class Teacher permissions
('class_teacher', 'add_teacher', 'N/A'),
('class_teacher', 'assign_classes', 'N/A'),
('class_teacher', 'timetable_editing', 'V'),

-- Subject Teacher permissions
('subject_teacher', 'add_teacher', 'N/A'),
('subject_teacher', 'assign_classes', 'N/A'),
('subject_teacher', 'timetable_editing', 'V')
ON CONFLICT (role, feature) DO NOTHING;

-- Create approval workflow table
CREATE TABLE IF NOT EXISTS teacher_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  approval_type VARCHAR(50) NOT NULL, -- 'onboarding', 'class_assignment', 'timetable_change'
  requested_by UUID REFERENCES auth.users(id),
  requested_by_role VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_by_role VARCHAR(20),
  approval_date TIMESTAMP,
  rejection_reason TEXT,
  request_data JSONB, -- Store the actual request data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create class assignments table (separate from teachers table)
CREATE TABLE IF NOT EXISTS class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
  class_name VARCHAR(50) NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'inactive')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_by_role VARCHAR(20),
  approved_by UUID REFERENCES auth.users(id),
  approved_by_role VARCHAR(20),
  approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(teacher_id, class_name, subject_name, academic_year)
);

-- Function to check user role and permissions
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id UUID,
  p_feature VARCHAR(50)
)
RETURNS VARCHAR(10) AS $$
DECLARE
  v_role VARCHAR(20);
  v_permission VARCHAR(10);
BEGIN
  -- Get user role from teachers table
  SELECT role INTO v_role
  FROM teachers
  WHERE id IN (
    SELECT id FROM teachers WHERE created_by = p_user_id
    UNION
    SELECT teacher_id FROM teacher_subject_mappings WHERE teacher_id IN (
      SELECT id FROM teachers WHERE email = (SELECT email FROM auth.users WHERE id = p_user_id)
    )
  )
  LIMIT 1;
  
  -- If not found in teachers, check school_educators
  IF v_role IS NULL THEN
    SELECT role INTO v_role
    FROM school_educators
    WHERE user_id = p_user_id
    LIMIT 1;
  END IF;
  
  -- Default to subject_teacher if no role found
  v_role := COALESCE(v_role, 'subject_teacher');
  
  -- Get permission level for this role and feature
  SELECT permission_level INTO v_permission
  FROM role_permissions
  WHERE role = v_role AND feature = p_feature;
  
  RETURN COALESCE(v_permission, 'N/A');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform action
CREATE OR REPLACE FUNCTION can_user_perform_action(
  p_user_id UUID,
  p_feature VARCHAR(50),
  p_action VARCHAR(10) -- 'C', 'A', 'U', 'V'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_permission VARCHAR(10);
BEGIN
  v_permission := check_user_permission(p_user_id, p_feature);
  
  -- Check if user has required permission
  CASE p_action
    WHEN 'C' THEN -- Create
      RETURN v_permission IN ('C', 'C/A', 'A');
    WHEN 'A' THEN -- Approve
      RETURN v_permission IN ('A', 'C/A');
    WHEN 'U' THEN -- Update
      RETURN v_permission IN ('U', 'C', 'C/A', 'A');
    WHEN 'V' THEN -- View
      RETURN v_permission IN ('V', 'U', 'C', 'C/A', 'A');
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  v_role VARCHAR(20);
BEGIN
  -- Try to get role from teachers table
  SELECT role INTO v_role
  FROM teachers
  WHERE email = (SELECT email FROM auth.users WHERE id = p_user_id)
  LIMIT 1;
  
  -- If not found, try school_educators
  IF v_role IS NULL THEN
    SELECT role INTO v_role
    FROM school_educators
    WHERE user_id = p_user_id
    LIMIT 1;
  END IF;
  
  -- Default to subject_teacher
  RETURN COALESCE(v_role, 'subject_teacher');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for teachers table
DROP POLICY IF EXISTS teachers_select_policy ON teachers;
DROP POLICY IF EXISTS teachers_insert_policy ON teachers;
DROP POLICY IF EXISTS teachers_update_policy ON teachers;
DROP POLICY IF EXISTS teachers_delete_policy ON teachers;

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- SELECT: All roles can view teachers in their school
CREATE POLICY teachers_select_policy ON teachers
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

-- INSERT: Only Principal and IT Admin can add teachers
CREATE POLICY teachers_insert_policy ON teachers
  FOR INSERT
  WITH CHECK (
    can_user_perform_action(auth.uid(), 'add_teacher', 'C') = TRUE
    AND school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Principal (approve), IT Admin (update), teachers can update own profile
CREATE POLICY teachers_update_policy ON teachers
  FOR UPDATE
  USING (
    can_user_perform_action(auth.uid(), 'add_teacher', 'U') = TRUE
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- DELETE: Only School Admin and Principal can delete
CREATE POLICY teachers_delete_policy ON teachers
  FOR DELETE
  USING (
    get_user_role(auth.uid()) IN ('school_admin', 'principal')
    AND school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

-- RLS for class_assignments
ALTER TABLE class_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY class_assignments_select_policy ON class_assignments
  FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teachers WHERE school_id IN (
        SELECT school_id FROM school_educators WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY class_assignments_insert_policy ON class_assignments
  FOR INSERT
  WITH CHECK (
    can_user_perform_action(auth.uid(), 'assign_classes', 'C') = TRUE
  );

CREATE POLICY class_assignments_update_policy ON class_assignments
  FOR UPDATE
  USING (
    can_user_perform_action(auth.uid(), 'assign_classes', 'A') = TRUE
    OR can_user_perform_action(auth.uid(), 'assign_classes', 'U') = TRUE
  );

-- RLS for timetable_slots
DROP POLICY IF EXISTS timetable_slots_select_policy ON timetable_slots;
DROP POLICY IF EXISTS timetable_slots_insert_policy ON timetable_slots;
DROP POLICY IF EXISTS timetable_slots_update_policy ON timetable_slots;
DROP POLICY IF EXISTS timetable_slots_delete_policy ON timetable_slots;

ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;

-- SELECT: All roles can view timetables
CREATE POLICY timetable_slots_select_policy ON timetable_slots
  FOR SELECT
  USING (
    can_user_perform_action(auth.uid(), 'timetable_editing', 'V') = TRUE
  );

-- INSERT: Principal and IT Admin can create slots
CREATE POLICY timetable_slots_insert_policy ON timetable_slots
  FOR INSERT
  WITH CHECK (
    can_user_perform_action(auth.uid(), 'timetable_editing', 'C') = TRUE
  );

-- UPDATE: Principal (approve), IT Admin (update)
CREATE POLICY timetable_slots_update_policy ON timetable_slots
  FOR UPDATE
  USING (
    can_user_perform_action(auth.uid(), 'timetable_editing', 'U') = TRUE
    OR can_user_perform_action(auth.uid(), 'timetable_editing', 'A') = TRUE
  );

-- DELETE: Only School Admin and Principal can delete
CREATE POLICY timetable_slots_delete_policy ON timetable_slots
  FOR DELETE
  USING (
    get_user_role(auth.uid()) IN ('school_admin', 'principal')
  );

-- RLS for teacher_approvals
ALTER TABLE teacher_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY teacher_approvals_select_policy ON teacher_approvals
  FOR SELECT
  USING (
    requested_by = auth.uid()
    OR get_user_role(auth.uid()) IN ('school_admin', 'principal', 'it_admin')
  );

CREATE POLICY teacher_approvals_insert_policy ON teacher_approvals
  FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
  );

CREATE POLICY teacher_approvals_update_policy ON teacher_approvals
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) IN ('school_admin', 'principal')
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teachers_role ON teachers(role);
CREATE INDEX IF NOT EXISTS idx_class_assignments_teacher ON class_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_status ON class_assignments(status);
CREATE INDEX IF NOT EXISTS idx_teacher_approvals_status ON teacher_approvals(status);
CREATE INDEX IF NOT EXISTS idx_teacher_approvals_requested_by ON teacher_approvals(requested_by);

-- Trigger to update updated_at
CREATE TRIGGER update_class_assignments_updated_at 
BEFORE UPDATE ON class_assignments 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_approvals_updated_at 
BEFORE UPDATE ON teacher_approvals 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE role_permissions IS 'Defines permission matrix for different roles';
COMMENT ON TABLE teacher_approvals IS 'Tracks approval workflow for teacher-related actions';
COMMENT ON TABLE class_assignments IS 'Manages class assignments with approval workflow';
COMMENT ON COLUMN teachers.role IS 'User role: school_admin, principal, it_admin, class_teacher, subject_teacher';
