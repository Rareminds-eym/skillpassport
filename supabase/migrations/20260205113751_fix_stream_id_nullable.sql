-- Migration: Make stream_id nullable and add 'college' stream
-- This allows assessments without a specific stream (for college students, after10, etc.)

-- First, ensure the 'college' stream exists for college students
INSERT INTO personal_assessment_streams (id, name, label, description, grade_level, is_active, display_order)
VALUES (
  'college',
  'College/University',
  'College/University',
  'General stream for college and university students (program-based assessment)',
  'college',
  true,
  999
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_active = true;

-- Make stream_id nullable (no default value)
ALTER TABLE personal_assessment_attempts 
ALTER COLUMN stream_id DROP NOT NULL;

-- Remove any default value
ALTER TABLE personal_assessment_attempts 
ALTER COLUMN stream_id DROP DEFAULT;

-- Add a comment explaining when stream_id can be null
COMMENT ON COLUMN personal_assessment_attempts.stream_id IS 
'Stream ID from personal_assessment_streams table. Can be NULL when stream is not applicable (e.g., college students where program matters more than stream, after10 students deciding on stream, etc.). Use ''college'' stream for college students.';

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'personal_assessment_attempts'
AND column_name = 'stream_id';

-- Show the college stream
SELECT id, name, label, description, grade_level, is_active
FROM personal_assessment_streams
WHERE id = 'college';
