-- =====================================================
-- ADD COLLEGE SUPPORT TO DEPARTMENTS TABLE
-- =====================================================
-- Created: December 2024
-- Purpose: Add college_id to departments table for college departments
-- Dependencies: departments, colleges
-- =====================================================

-- Add college_id column to departments table
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id) ON DELETE CASCADE;

-- Add index for college_id
CREATE INDEX IF NOT EXISTS idx_departments_college ON departments(college_id);

-- Add comment
COMMENT ON COLUMN departments.college_id IS 'Reference to colleges table for college departments (NULL for school departments)';

-- Add constraint to ensure either school_id or college_id is set (but not both)
ALTER TABLE departments 
DROP CONSTRAINT IF EXISTS chk_departments_institution;

ALTER TABLE departments 
ADD CONSTRAINT chk_departments_institution CHECK (
  (school_id IS NOT NULL AND college_id IS NULL) OR
  (school_id IS NULL AND college_id IS NOT NULL)
);

COMMENT ON CONSTRAINT chk_departments_institution ON departments IS 'Ensures department belongs to either a school OR a college, not both';

-- Update unique constraint to include college_id
ALTER TABLE departments 
DROP CONSTRAINT IF EXISTS departments_school_id_code_key;

-- Create unique index for school departments
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_school_code_unique 
ON departments(school_id, code) 
WHERE school_id IS NOT NULL;

-- Create unique index for college departments
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_college_code_unique 
ON departments(college_id, code) 
WHERE college_id IS NOT NULL;

COMMENT ON INDEX idx_departments_school_code_unique IS 'Ensures unique department codes within each school';
COMMENT ON INDEX idx_departments_college_code_unique IS 'Ensures unique department codes within each college';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
