-- ============================================================================
-- CURRICULUM CONFIGURATION TABLES
-- ============================================================================
-- Purpose: Store configurable data for curriculum builder (subjects, classes, etc.)
-- ============================================================================

-- ============================================================================
-- 1. SUBJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS curriculum_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique subject names per school (or globally if school_id is NULL)
  UNIQUE(school_id, name)
);

-- Insert default subjects (global, school_id = NULL)
INSERT INTO curriculum_subjects (school_id, name, display_order) VALUES
  (NULL, 'Mathematics', 1),
  (NULL, 'Physics', 2),
  (NULL, 'Chemistry', 3),
  (NULL, 'Biology', 4),
  (NULL, 'English', 5),
  (NULL, 'History', 6),
  (NULL, 'Computer Science', 7),
  (NULL, 'Economics', 8),
  (NULL, 'Geography', 9),
  (NULL, 'Political Science', 10),
  (NULL, 'Sociology', 11),
  (NULL, 'Psychology', 12),
  (NULL, 'Business Studies', 13),
  (NULL, 'Accountancy', 14),
  (NULL, 'Physical Education', 15),
  (NULL, 'Art', 16),
  (NULL, 'Music', 17)
ON CONFLICT (school_id, name) DO NOTHING;

-- ============================================================================
-- 2. CLASSES/GRADES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS curriculum_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique class names per school (or globally if school_id is NULL)
  UNIQUE(school_id, name)
);

-- Insert default classes (global, school_id = NULL)
INSERT INTO curriculum_classes (school_id, name, display_order) VALUES
  (NULL, '1', 1),
  (NULL, '2', 2),
  (NULL, '3', 3),
  (NULL, '4', 4),
  (NULL, '5', 5),
  (NULL, '6', 6),
  (NULL, '7', 7),
  (NULL, '8', 8),
  (NULL, '9', 9),
  (NULL, '10', 10),
  (NULL, '11', 11),
  (NULL, '12', 12)
ON CONFLICT (school_id, name) DO NOTHING;

-- ============================================================================
-- 3. ACADEMIC YEARS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS curriculum_academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  year VARCHAR(20) NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique academic years per school (or globally if school_id is NULL)
  UNIQUE(school_id, year)
);

-- Insert default academic years (global, school_id = NULL)
INSERT INTO curriculum_academic_years (school_id, year, start_date, end_date, is_current) VALUES
  (NULL, '2023-2024', '2023-04-01', '2024-03-31', FALSE),
  (NULL, '2024-2025', '2024-04-01', '2025-03-31', TRUE),
  (NULL, '2025-2026', '2025-04-01', '2026-03-31', FALSE),
  (NULL, '2026-2027', '2026-04-01', '2027-03-31', FALSE),
  (NULL, '2027-2028', '2027-04-01', '2028-03-31', FALSE)
ON CONFLICT (school_id, year) DO NOTHING;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_curriculum_subjects_school ON curriculum_subjects(school_id);
CREATE INDEX idx_curriculum_subjects_active ON curriculum_subjects(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_curriculum_subjects_order ON curriculum_subjects(display_order);

CREATE INDEX idx_curriculum_classes_school ON curriculum_classes(school_id);
CREATE INDEX idx_curriculum_classes_active ON curriculum_classes(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_curriculum_classes_order ON curriculum_classes(display_order);

CREATE INDEX idx_curriculum_academic_years_school ON curriculum_academic_years(school_id);
CREATE INDEX idx_curriculum_academic_years_active ON curriculum_academic_years(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_curriculum_academic_years_current ON curriculum_academic_years(is_current) WHERE is_current = TRUE;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

CREATE TRIGGER update_curriculum_subjects_updated_at 
BEFORE UPDATE ON curriculum_subjects 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculum_classes_updated_at 
BEFORE UPDATE ON curriculum_classes 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculum_academic_years_updated_at 
BEFORE UPDATE ON curriculum_academic_years 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE curriculum_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_academic_years ENABLE ROW LEVEL SECURITY;

-- Subjects Policies (Read for all authenticated users)
CREATE POLICY "Anyone can view subjects"
  ON curriculum_subjects FOR SELECT
  TO authenticated
  USING (
    school_id IS NULL OR 
    school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

-- Classes Policies (Read for all authenticated users)
CREATE POLICY "Anyone can view classes"
  ON curriculum_classes FOR SELECT
  TO authenticated
  USING (
    school_id IS NULL OR 
    school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

-- Academic Years Policies (Read for all authenticated users)
CREATE POLICY "Anyone can view academic years"
  ON curriculum_academic_years FOR SELECT
  TO authenticated
  USING (
    school_id IS NULL OR 
    school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current academic year
CREATE OR REPLACE FUNCTION get_current_academic_year(p_school_id UUID DEFAULT NULL)
RETURNS VARCHAR AS $$
DECLARE
  v_year VARCHAR;
BEGIN
  SELECT year INTO v_year
  FROM curriculum_academic_years
  WHERE (school_id = p_school_id OR (school_id IS NULL AND p_school_id IS NULL))
  AND is_current = TRUE
  AND is_active = TRUE
  ORDER BY school_id NULLS LAST
  LIMIT 1;
  
  RETURN v_year;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE curriculum_subjects IS 'Configurable subjects for curriculum builder';
COMMENT ON TABLE curriculum_classes IS 'Configurable classes/grades for curriculum builder';
COMMENT ON TABLE curriculum_academic_years IS 'Configurable academic years for curriculum builder';

COMMENT ON COLUMN curriculum_subjects.school_id IS 'NULL for global subjects, specific school_id for school-specific subjects';
COMMENT ON COLUMN curriculum_classes.school_id IS 'NULL for global classes, specific school_id for school-specific classes';
COMMENT ON COLUMN curriculum_academic_years.school_id IS 'NULL for global years, specific school_id for school-specific years';
COMMENT ON COLUMN curriculum_academic_years.is_current IS 'Only one academic year should be current at a time';

-- ============================================================================
-- END OF CURRICULUM CONFIGURATION TABLES
-- ============================================================================
