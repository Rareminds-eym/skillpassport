-- ============================================================================
-- CURRICULUM BUILDER SCHEMA
-- ============================================================================
-- Purpose: Complete database schema for Curriculum Builder feature
-- Tables: curriculums, curriculum_chapters, curriculum_learning_outcomes,
--         assessment_types, outcome_assessment_mappings
-- ============================================================================

-- ============================================================================
-- 1. ASSESSMENT TYPES TABLE (Master Data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique assessment type names per school (or globally if school_id is NULL)
  UNIQUE(school_id, name)
);

-- Insert default assessment types (global, school_id = NULL)
INSERT INTO assessment_types (school_id, name, description) VALUES
  (NULL, 'Written Test', 'Traditional written examination'),
  (NULL, 'Practical Exam', 'Hands-on practical assessment'),
  (NULL, 'Project', 'Project-based evaluation'),
  (NULL, 'Assignment', 'Take-home assignments'),
  (NULL, 'Presentation', 'Oral presentation'),
  (NULL, 'Quiz', 'Short quiz assessment'),
  (NULL, 'Lab Work', 'Laboratory work evaluation'),
  (NULL, 'Class Participation', 'Active participation in class')
ON CONFLICT (school_id, name) DO NOTHING;

-- ============================================================================
-- 2. CURRICULUMS TABLE (Main Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS curriculums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Information
  subject VARCHAR(100) NOT NULL,
  class VARCHAR(10) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  
  -- Approval Workflow
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
  
  -- Ownership & Approval
  created_by UUID REFERENCES school_educators(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_date TIMESTAMP,
  rejection_reason TEXT,
  
  -- Metadata
  last_modified TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one curriculum per subject/class/academic_year combination per school
  UNIQUE(school_id, subject, class, academic_year)
);

-- ============================================================================
-- 3. CURRICULUM CHAPTERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS curriculum_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id UUID REFERENCES curriculums(id) ON DELETE CASCADE NOT NULL,
  
  -- Chapter Information
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50), -- Optional chapter code/number (e.g., CH-01, 1.1)
  description TEXT NOT NULL,
  order_number INTEGER NOT NULL, -- Display order
  
  -- Duration Information
  estimated_duration INTEGER, -- Duration value
  duration_unit VARCHAR(10) CHECK (duration_unit IN ('hours', 'weeks')),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique order within curriculum
  UNIQUE(curriculum_id, order_number)
);

-- ============================================================================
-- 4. CURRICULUM LEARNING OUTCOMES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS curriculum_learning_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES curriculum_chapters(id) ON DELETE CASCADE NOT NULL,
  
  -- Learning Outcome Information
  outcome TEXT NOT NULL,
  bloom_level VARCHAR(20) CHECK (bloom_level IN ('Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create')),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. OUTCOME ASSESSMENT MAPPINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS outcome_assessment_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_outcome_id UUID REFERENCES curriculum_learning_outcomes(id) ON DELETE CASCADE NOT NULL,
  assessment_type_id UUID REFERENCES assessment_types(id) ON DELETE CASCADE NOT NULL,
  
  -- Weightage (optional, percentage)
  weightage DECIMAL(5,2) CHECK (weightage >= 0 AND weightage <= 100),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure unique mapping per outcome-assessment combination
  UNIQUE(learning_outcome_id, assessment_type_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Assessment Types Indexes
CREATE INDEX idx_assessment_types_school ON assessment_types(school_id);
CREATE INDEX idx_assessment_types_active ON assessment_types(is_active) WHERE is_active = TRUE;

-- Curriculums Indexes
CREATE INDEX idx_curriculums_school ON curriculums(school_id);
CREATE INDEX idx_curriculums_status ON curriculums(status);
CREATE INDEX idx_curriculums_created_by ON curriculums(created_by);
CREATE INDEX idx_curriculums_subject_class ON curriculums(subject, class, academic_year);
CREATE INDEX idx_curriculums_academic_year ON curriculums(academic_year);

-- Curriculum Chapters Indexes
CREATE INDEX idx_chapters_curriculum ON curriculum_chapters(curriculum_id);
CREATE INDEX idx_chapters_order ON curriculum_chapters(curriculum_id, order_number);

-- Learning Outcomes Indexes
CREATE INDEX idx_outcomes_chapter ON curriculum_learning_outcomes(chapter_id);
CREATE INDEX idx_outcomes_bloom ON curriculum_learning_outcomes(bloom_level);

-- Assessment Mappings Indexes
CREATE INDEX idx_mappings_outcome ON outcome_assessment_mappings(learning_outcome_id);
CREATE INDEX idx_mappings_assessment ON outcome_assessment_mappings(assessment_type_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

CREATE TRIGGER update_assessment_types_updated_at 
BEFORE UPDATE ON assessment_types 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculums_updated_at 
BEFORE UPDATE ON curriculums 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculum_chapters_updated_at 
BEFORE UPDATE ON curriculum_chapters 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curriculum_learning_outcomes_updated_at 
BEFORE UPDATE ON curriculum_learning_outcomes 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER FOR LAST_MODIFIED ON CURRICULUMS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_curriculum_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_modified on parent curriculum when chapters or outcomes change
  UPDATE curriculums 
  SET last_modified = NOW() 
  WHERE id = (
    SELECT curriculum_id 
    FROM curriculum_chapters 
    WHERE id = COALESCE(NEW.chapter_id, NEW.curriculum_id, OLD.chapter_id, OLD.curriculum_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_curriculum_on_chapter_change
AFTER INSERT OR UPDATE OR DELETE ON curriculum_chapters
FOR EACH ROW
EXECUTE FUNCTION update_curriculum_last_modified();

CREATE TRIGGER update_curriculum_on_outcome_change
AFTER INSERT OR UPDATE OR DELETE ON curriculum_learning_outcomes
FOR EACH ROW
EXECUTE FUNCTION update_curriculum_last_modified();

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- View: Curriculum Summary with Statistics
CREATE OR REPLACE VIEW curriculum_summary AS
SELECT 
  c.id,
  c.school_id,
  c.subject,
  c.class,
  c.academic_year,
  c.status,
  c.created_by,
  c.approved_by,
  c.approval_date,
  c.rejection_reason,
  c.last_modified,
  c.created_at,
  se.first_name || ' ' || se.last_name AS created_by_name,
  se.email AS created_by_email,
  COUNT(DISTINCT cc.id) AS total_chapters,
  COUNT(DISTINCT clo.id) AS total_outcomes,
  COUNT(DISTINCT oam.id) AS total_assessment_mappings,
  CASE 
    WHEN COUNT(DISTINCT cc.id) = 0 THEN 0
    ELSE ROUND(
      (COUNT(DISTINCT CASE WHEN clo.id IS NOT NULL THEN cc.id END)::DECIMAL / 
       COUNT(DISTINCT cc.id)::DECIMAL) * 100
    )
  END AS completion_percentage
FROM curriculums c
LEFT JOIN school_educators se ON c.created_by = se.id
LEFT JOIN curriculum_chapters cc ON c.id = cc.curriculum_id
LEFT JOIN curriculum_learning_outcomes clo ON cc.id = clo.chapter_id
LEFT JOIN outcome_assessment_mappings oam ON clo.id = oam.learning_outcome_id
GROUP BY c.id, se.first_name, se.last_name, se.email;

-- View: Chapter Details with Outcome Count
CREATE OR REPLACE VIEW chapter_details AS
SELECT 
  cc.id,
  cc.curriculum_id,
  cc.name,
  cc.code,
  cc.description,
  cc.order_number,
  cc.estimated_duration,
  cc.duration_unit,
  cc.created_at,
  COUNT(clo.id) AS outcome_count
FROM curriculum_chapters cc
LEFT JOIN curriculum_learning_outcomes clo ON cc.id = clo.chapter_id
GROUP BY cc.id;

-- View: Learning Outcomes with Assessment Details
CREATE OR REPLACE VIEW learning_outcome_details AS
SELECT 
  clo.id,
  clo.chapter_id,
  clo.outcome,
  clo.bloom_level,
  cc.name AS chapter_name,
  cc.curriculum_id,
  c.subject,
  c.class,
  c.academic_year,
  COUNT(oam.id) AS assessment_count,
  ARRAY_AGG(
    CASE 
      WHEN at.name IS NOT NULL 
      THEN jsonb_build_object(
        'assessment_type', at.name,
        'weightage', oam.weightage
      )
    END
  ) FILTER (WHERE at.name IS NOT NULL) AS assessment_mappings
FROM curriculum_learning_outcomes clo
JOIN curriculum_chapters cc ON clo.chapter_id = cc.id
JOIN curriculums c ON cc.curriculum_id = c.id
LEFT JOIN outcome_assessment_mappings oam ON clo.id = oam.learning_outcome_id
LEFT JOIN assessment_types at ON oam.assessment_type_id = at.id
GROUP BY clo.id, cc.name, cc.curriculum_id, c.subject, c.class, c.academic_year;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get Curriculum Validation Status
CREATE OR REPLACE FUNCTION validate_curriculum(p_curriculum_id UUID)
RETURNS TABLE(
  is_valid BOOLEAN,
  validation_errors JSONB
) AS $$
DECLARE
  v_errors JSONB := '[]'::jsonb;
  v_chapter_count INTEGER;
  v_outcome_count INTEGER;
  v_outcomes_without_assessments INTEGER;
BEGIN
  -- Check if curriculum has chapters
  SELECT COUNT(*) INTO v_chapter_count
  FROM curriculum_chapters
  WHERE curriculum_id = p_curriculum_id;
  
  IF v_chapter_count = 0 THEN
    v_errors := v_errors || jsonb_build_object('field', 'chapters', 'message', 'At least one chapter is required');
  END IF;
  
  -- Check if curriculum has learning outcomes
  SELECT COUNT(*) INTO v_outcome_count
  FROM curriculum_learning_outcomes clo
  JOIN curriculum_chapters cc ON clo.chapter_id = cc.id
  WHERE cc.curriculum_id = p_curriculum_id;
  
  IF v_outcome_count = 0 THEN
    v_errors := v_errors || jsonb_build_object('field', 'outcomes', 'message', 'Learning Outcomes cannot be empty');
  END IF;
  
  -- Check if all outcomes have at least one assessment mapping
  SELECT COUNT(*) INTO v_outcomes_without_assessments
  FROM curriculum_learning_outcomes clo
  JOIN curriculum_chapters cc ON clo.chapter_id = cc.id
  WHERE cc.curriculum_id = p_curriculum_id
  AND NOT EXISTS (
    SELECT 1 FROM outcome_assessment_mappings oam
    WHERE oam.learning_outcome_id = clo.id
  );
  
  IF v_outcomes_without_assessments > 0 THEN
    v_errors := v_errors || jsonb_build_object(
      'field', 'assessments', 
      'message', v_outcomes_without_assessments || ' learning outcome(s) missing assessment mappings'
    );
  END IF;
  
  RETURN QUERY SELECT 
    jsonb_array_length(v_errors) = 0 AS is_valid,
    v_errors AS validation_errors;
END;
$$ LANGUAGE plpgsql;

-- Function: Copy Curriculum Template
CREATE OR REPLACE FUNCTION copy_curriculum_template(
  p_source_curriculum_id UUID,
  p_target_school_id UUID,
  p_target_subject VARCHAR,
  p_target_class VARCHAR,
  p_target_academic_year VARCHAR,
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_new_curriculum_id UUID;
  v_chapter_record RECORD;
  v_new_chapter_id UUID;
  v_outcome_record RECORD;
  v_new_outcome_id UUID;
  v_mapping_record RECORD;
BEGIN
  -- Create new curriculum
  INSERT INTO curriculums (
    school_id, subject, class, academic_year, status, created_by
  ) VALUES (
    p_target_school_id, p_target_subject, p_target_class, p_target_academic_year, 'draft', p_created_by
  ) RETURNING id INTO v_new_curriculum_id;
  
  -- Copy chapters
  FOR v_chapter_record IN 
    SELECT * FROM curriculum_chapters 
    WHERE curriculum_id = p_source_curriculum_id 
    ORDER BY order_number
  LOOP
    INSERT INTO curriculum_chapters (
      curriculum_id, name, code, description, order_number, 
      estimated_duration, duration_unit
    ) VALUES (
      v_new_curriculum_id, v_chapter_record.name, v_chapter_record.code, 
      v_chapter_record.description, v_chapter_record.order_number,
      v_chapter_record.estimated_duration, v_chapter_record.duration_unit
    ) RETURNING id INTO v_new_chapter_id;
    
    -- Copy learning outcomes for this chapter
    FOR v_outcome_record IN 
      SELECT * FROM curriculum_learning_outcomes 
      WHERE chapter_id = v_chapter_record.id
    LOOP
      INSERT INTO curriculum_learning_outcomes (
        chapter_id, outcome, bloom_level
      ) VALUES (
        v_new_chapter_id, v_outcome_record.outcome, v_outcome_record.bloom_level
      ) RETURNING id INTO v_new_outcome_id;
      
      -- Copy assessment mappings for this outcome
      FOR v_mapping_record IN 
        SELECT * FROM outcome_assessment_mappings 
        WHERE learning_outcome_id = v_outcome_record.id
      LOOP
        INSERT INTO outcome_assessment_mappings (
          learning_outcome_id, assessment_type_id, weightage
        ) VALUES (
          v_new_outcome_id, v_mapping_record.assessment_type_id, v_mapping_record.weightage
        );
      END LOOP;
    END LOOP;
  END LOOP;
  
  RETURN v_new_curriculum_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_assessment_mappings ENABLE ROW LEVEL SECURITY;

-- Assessment Types Policies (Read-only for all authenticated users)
CREATE POLICY "Anyone can view assessment types"
  ON assessment_types FOR SELECT
  TO authenticated
  USING (TRUE);

-- Curriculums Policies
CREATE POLICY "Educators can view curriculums from their school"
  ON curriculums FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Educators can create curriculums"
  ON curriculums FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by IN (SELECT id FROM school_educators WHERE user_id = auth.uid())
  );

CREATE POLICY "Educators can update their own draft/rejected curriculums"
  ON curriculums FOR UPDATE
  TO authenticated
  USING (
    created_by IN (SELECT id FROM school_educators WHERE user_id = auth.uid())
    AND status IN ('draft', 'rejected')
  );

CREATE POLICY "Educators can delete their own draft curriculums"
  ON curriculums FOR DELETE
  TO authenticated
  USING (
    created_by IN (SELECT id FROM school_educators WHERE user_id = auth.uid())
    AND status = 'draft'
  );

-- Curriculum Chapters Policies (inherit from parent curriculum)
CREATE POLICY "Educators can view chapters from their school curriculums"
  ON curriculum_chapters FOR SELECT
  TO authenticated
  USING (
    curriculum_id IN (
      SELECT id FROM curriculums 
      WHERE school_id IN (
        SELECT school_id FROM school_educators WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Educators can manage chapters in their draft/rejected curriculums"
  ON curriculum_chapters FOR ALL
  TO authenticated
  USING (
    curriculum_id IN (
      SELECT id FROM curriculums 
      WHERE created_by IN (SELECT id FROM school_educators WHERE user_id = auth.uid())
      AND status IN ('draft', 'rejected')
    )
  );

-- Learning Outcomes Policies (inherit from parent chapter)
CREATE POLICY "Educators can view outcomes from their school curriculums"
  ON curriculum_learning_outcomes FOR SELECT
  TO authenticated
  USING (
    chapter_id IN (
      SELECT cc.id FROM curriculum_chapters cc
      JOIN curriculums c ON cc.curriculum_id = c.id
      WHERE c.school_id IN (
        SELECT school_id FROM school_educators WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Educators can manage outcomes in their draft/rejected curriculums"
  ON curriculum_learning_outcomes FOR ALL
  TO authenticated
  USING (
    chapter_id IN (
      SELECT cc.id FROM curriculum_chapters cc
      JOIN curriculums c ON cc.curriculum_id = c.id
      WHERE c.created_by IN (SELECT id FROM school_educators WHERE user_id = auth.uid())
      AND c.status IN ('draft', 'rejected')
    )
  );

-- Assessment Mappings Policies (inherit from parent outcome)
CREATE POLICY "Educators can view mappings from their school curriculums"
  ON outcome_assessment_mappings FOR SELECT
  TO authenticated
  USING (
    learning_outcome_id IN (
      SELECT clo.id FROM curriculum_learning_outcomes clo
      JOIN curriculum_chapters cc ON clo.chapter_id = cc.id
      JOIN curriculums c ON cc.curriculum_id = c.id
      WHERE c.school_id IN (
        SELECT school_id FROM school_educators WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Educators can manage mappings in their draft/rejected curriculums"
  ON outcome_assessment_mappings FOR ALL
  TO authenticated
  USING (
    learning_outcome_id IN (
      SELECT clo.id FROM curriculum_learning_outcomes clo
      JOIN curriculum_chapters cc ON clo.chapter_id = cc.id
      JOIN curriculums c ON cc.curriculum_id = c.id
      WHERE c.created_by IN (SELECT id FROM school_educators WHERE user_id = auth.uid())
      AND c.status IN ('draft', 'rejected')
    )
  );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE curriculums IS 'Main curriculum table storing subject-wise curriculum for each class';
COMMENT ON TABLE curriculum_chapters IS 'Chapters within a curriculum with order and duration';
COMMENT ON TABLE curriculum_learning_outcomes IS 'Learning outcomes mapped to chapters with Bloom taxonomy';
COMMENT ON TABLE assessment_types IS 'Master table for assessment types (Written Test, Project, etc.)';
COMMENT ON TABLE outcome_assessment_mappings IS 'Maps learning outcomes to assessment types with weightage';

COMMENT ON COLUMN curriculums.status IS 'Workflow status: draft, pending_approval, approved, rejected';
COMMENT ON COLUMN curriculum_learning_outcomes.bloom_level IS 'Bloom''s Taxonomy cognitive level';
COMMENT ON COLUMN outcome_assessment_mappings.weightage IS 'Assessment weightage percentage (0-100)';

-- ============================================================================
-- END OF CURRICULUM BUILDER SCHEMA
-- ============================================================================
