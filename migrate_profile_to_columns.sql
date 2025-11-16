-- Migration script to move data from profile JSONB to individual columns
-- Run this in Supabase SQL Editor to migrate existing data

-- Step 1: Update existing records to move profile data to individual columns
UPDATE students 
SET 
  name = COALESCE(name, profile->>'name'),
  email = COALESCE(email, profile->>'email'),
  contact_number = COALESCE(contact_number, profile->>'phone', profile->>'contact_number'),
  alternate_number = COALESCE(alternate_number, profile->>'alternatePhone', profile->>'alternate_number'),
  university = COALESCE(university, profile->>'university'),
  branch_field = COALESCE(branch_field, profile->>'department', profile->>'branch_field'),
  github_link = COALESCE(github_link, profile->>'github_link'),
  linkedin_link = COALESCE(linkedin_link, profile->>'linkedin_link'),
  twitter_link = COALESCE(twitter_link, profile->>'twitter_link'),
  facebook_link = COALESCE(facebook_link, profile->>'facebook_link'),
  instagram_link = COALESCE(instagram_link, profile->>'instagram_link'),
  portfolio_link = COALESCE(portfolio_link, profile->>'portfolio_link'),
  registration_number = COALESCE(registration_number, profile->>'registrationNumber', profile->>'registration_number'),
  college_school_name = COALESCE(college_school_name, profile->>'college', profile->>'college_school_name'),
  district_name = COALESCE(district_name, profile->>'district', profile->>'district_name'),
  date_of_birth = COALESCE(date_of_birth, (profile->>'dateOfBirth')::date, (profile->>'date_of_birth')::date),
  age = COALESCE(age, (profile->>'age')::integer),
  updated_at = NOW()
WHERE profile IS NOT NULL;

-- Step 2: Add computed columns for commonly accessed profile data
-- Add a computed column for class year if needed
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS class_year VARCHAR(20);

-- Update class year from profile if it exists
UPDATE students 
SET class_year = profile->>'classYear'
WHERE profile->>'classYear' IS NOT NULL;

-- Step 3: Create indexes on the new columns for better performance
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_branch_field ON students(branch_field);
CREATE INDEX IF NOT EXISTS idx_students_university ON students(university);
CREATE INDEX IF NOT EXISTS idx_students_contact_number ON students(contact_number);
CREATE INDEX IF NOT EXISTS idx_students_registration_number ON students(registration_number);

-- Step 4: Verify the migration
SELECT 
  COUNT(*) as total_students,
  COUNT(name) as students_with_name,
  COUNT(email) as students_with_email,
  COUNT(contact_number) as students_with_contact,
  COUNT(university) as students_with_university,
  COUNT(branch_field) as students_with_branch
FROM students;

-- Step 5: Show sample of migrated data
SELECT 
  id,
  name,
  email,
  contact_number,
  university,
  branch_field,
  registration_number,
  github_link,
  linkedin_link
FROM students 
LIMIT 5;