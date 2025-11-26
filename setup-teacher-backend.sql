-- ============================================
-- Teacher Management Backend Setup Script
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-documents', 'teacher-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add Storage Policies
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'teacher-documents');

CREATE POLICY IF NOT EXISTS "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'teacher-documents');

CREATE POLICY IF NOT EXISTS "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'teacher-documents');

-- Step 3: Ensure role column exists in teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'subject_teacher'
CHECK (role IN ('school_admin', 'principal', 'it_admin', 'class_teacher', 'subject_teacher'));

-- Step 4: Add sample teacher (optional - update school_id)
-- Uncomment and update school_id to test
/*
INSERT INTO teachers (
  school_id,
  first_name,
  last_name,
  email,
  phone,
  role,
  subject_expertise,
  onboarding_status
) VALUES (
  (SELECT id FROM schools LIMIT 1), -- Replace with your school_id
  'John',
  'Doe',
  'john.doe@school.edu',
  '1234567890',
  'subject_teacher',
  '[
    {"name": "Mathematics", "proficiency": "expert", "years_experience": 5},
    {"name": "Physics", "proficiency": "advanced", "years_experience": 3}
  ]'::jsonb,
  'active'
)
ON CONFLICT (email) DO NOTHING;
*/

-- Step 5: Verify setup
SELECT 
  'Teachers table' as component,
  COUNT(*) as count
FROM teachers
UNION ALL
SELECT 
  'Timetables table',
  COUNT(*)
FROM timetables
UNION ALL
SELECT 
  'Timetable slots',
  COUNT(*)
FROM timetable_slots
UNION ALL
SELECT 
  'Storage buckets',
  COUNT(*)
FROM storage.buckets
WHERE name = 'teacher-documents';

-- ============================================
-- Setup Complete! ✅
-- ============================================
-- Next steps:
-- 1. Go to School Admin > Teacher Management
-- 2. Add teachers in Onboarding tab
-- 3. Assign timetables in Timetable tab
-- ============================================
