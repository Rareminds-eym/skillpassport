-- ADAPTED SQL Schema for Existing Supabase Student Table
-- This works with your existing students table structure

-- ==================== VERIFY EXISTING STUDENTS TABLE ====================
-- Your existing students table structure:
-- students (
--   userId UUID (FK to auth.users)
--   universityId TEXT
--   profile JSONB (stores all student data)
--   createdAt TIMESTAMP
--   updatedAt TIMESTAMP
--   id UUID (PK)
-- )

-- ==================== NO NEW TABLES NEEDED ====================
-- All data will be stored in the existing students.profile JSONB column

-- ==================== EXAMPLE PROFILE STRUCTURE ====================
-- The profile JSONB will contain all student information:
/*
{
  "name": "Priya Sharma",
  "department": "Computer Science Engineering",
  "photo": "https://...",
  "verified": true,
  "employabilityScore": 85,
  "cgpa": "8.9",
  "yearOfPassing": "2025",
  "passportId": "IIT-CSE-2024-001",
  "email": "priya@example.com",
  "phone": "+91...",
  
  "education": [
    {
      "id": 1,
      "degree": "B.Tech Computer Science",
      "university": "IIT Chennai",
      "yearOfPassing": "2025",
      "cgpa": "8.9",
      "level": "Bachelor's",
      "status": "ongoing"
    }
  ],
  
  "training": [
    {
      "id": 1,
      "course": "Full Stack Development",
      "progress": 80,
      "status": "ongoing"
    }
  ],
  
  "experience": [
    {
      "id": 1,
      "role": "Frontend Developer Intern",
      "organization": "Tech Startup Inc.",
      "duration": "Jun 2024 - Aug 2024",
      "verified": true
    }
  ],
  
  "technicalSkills": [
    {
      "id": 1,
      "name": "React",
      "level": 4,
      "verified": true,
      "icon": "⚛️"
    }
  ],
  
  "softSkills": [
    {
      "id": 1,
      "name": "English",
      "level": 5,
      "type": "language"
    }
  ],
  
  "opportunities": [
    {
      "id": 1,
      "title": "Web Developer Intern",
      "company": "TCS",
      "type": "internship",
      "deadline": "2024-12-15"
    }
  ],
  
  "recentUpdates": [
    {
      "id": 1,
      "message": "You completed FSQM Module 4",
      "timestamp": "2024-10-10T10:00:00Z",
      "type": "achievement"
    }
  ],
  
  "suggestions": [
    {
      "id": 1,
      "message": "Add your latest project",
      "priority": 3,
      "isActive": true
    }
  ]
}
*/

-- ==================== HELPER FUNCTIONS FOR JSONB OPERATIONS ====================

-- Function to add an item to a JSONB array in profile
CREATE OR REPLACE FUNCTION add_to_profile_array(
  p_student_id UUID,
  p_array_name TEXT,
  p_new_item JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile JSONB;
  v_array JSONB;
  v_new_id INTEGER;
BEGIN
  -- Get current profile
  SELECT profile INTO v_profile
  FROM students
  WHERE id = p_student_id;
  
  -- Get current array or initialize empty
  v_array := COALESCE(v_profile -> p_array_name, '[]'::jsonb);
  
  -- Generate new ID
  v_new_id := COALESCE(
    (SELECT MAX((elem->>'id')::int) FROM jsonb_array_elements(v_array) elem),
    0
  ) + 1;
  
  -- Add id to new item
  p_new_item := jsonb_set(p_new_item, '{id}', to_jsonb(v_new_id));
  
  -- Append to array
  v_array := v_array || p_new_item;
  
  -- Update profile
  v_profile := jsonb_set(v_profile, ARRAY[p_array_name], v_array);
  
  -- Save and return
  UPDATE students SET profile = v_profile WHERE id = p_student_id;
  
  RETURN v_profile;
END;
$$;

-- Function to update an item in a JSONB array
CREATE OR REPLACE FUNCTION update_profile_array_item(
  p_student_id UUID,
  p_array_name TEXT,
  p_item_id INTEGER,
  p_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile JSONB;
  v_array JSONB;
  v_new_array JSONB := '[]'::jsonb;
  v_item JSONB;
BEGIN
  -- Get current profile
  SELECT profile INTO v_profile
  FROM students
  WHERE id = p_student_id;
  
  -- Get array
  v_array := v_profile -> p_array_name;
  
  -- Update matching item
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_array)
  LOOP
    IF (v_item->>'id')::int = p_item_id THEN
      v_item := v_item || p_updates;
    END IF;
    v_new_array := v_new_array || v_item;
  END LOOP;
  
  -- Update profile
  v_profile := jsonb_set(v_profile, ARRAY[p_array_name], v_new_array);
  
  -- Save and return
  UPDATE students SET profile = v_profile WHERE id = p_student_id;
  
  RETURN v_profile;
END;
$$;

-- Function to delete an item from a JSONB array
CREATE OR REPLACE FUNCTION delete_from_profile_array(
  p_student_id UUID,
  p_array_name TEXT,
  p_item_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile JSONB;
  v_array JSONB;
  v_new_array JSONB := '[]'::jsonb;
  v_item JSONB;
BEGIN
  -- Get current profile
  SELECT profile INTO v_profile
  FROM students
  WHERE id = p_student_id;
  
  -- Get array
  v_array := v_profile -> p_array_name;
  
  -- Filter out matching item
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_array)
  LOOP
    IF (v_item->>'id')::int != p_item_id THEN
      v_new_array := v_new_array || v_item;
    END IF;
  END LOOP;
  
  -- Update profile
  v_profile := jsonb_set(v_profile, ARRAY[p_array_name], v_new_array);
  
  -- Save and return
  UPDATE students SET profile = v_profile WHERE id = p_student_id;
  
  RETURN v_profile;
END;
$$;

-- ==================== INDEXES FOR JSONB QUERIES ====================

-- Create GIN index on profile JSONB for faster queries
CREATE INDEX IF NOT EXISTS idx_students_profile_gin 
ON students USING gin (profile);

-- Create specific indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_students_profile_name 
ON students ((profile->>'name'));

CREATE INDEX IF NOT EXISTS idx_students_profile_email 
ON students ((profile->>'email'));

CREATE INDEX IF NOT EXISTS idx_students_profile_passport_id 
ON students ((profile->>'passportId'));

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on students table (if not already enabled)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own profile
DROP POLICY IF EXISTS "Students can view own profile" ON students;
CREATE POLICY "Students can view own profile" 
ON students FOR SELECT 
USING (auth.uid() = "userId");

-- Policy: Students can update their own profile
DROP POLICY IF EXISTS "Students can update own profile" ON students;
CREATE POLICY "Students can update own profile" 
ON students FOR UPDATE 
USING (auth.uid() = "userId");

-- Policy: Students can insert their own profile
DROP POLICY IF EXISTS "Students can insert own profile" ON students;
CREATE POLICY "Students can insert own profile" 
ON students FOR INSERT 
WITH CHECK (auth.uid() = "userId");

-- ==================== UPDATED_AT TRIGGER ====================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (if not exists)
DROP TRIGGER IF EXISTS set_students_updated_at ON students;
CREATE TRIGGER set_students_updated_at 
BEFORE UPDATE ON students 
FOR EACH ROW 
EXECUTE FUNCTION update_students_updated_at();

-- ==================== EXAMPLE QUERIES ====================

-- Get student profile
-- SELECT profile FROM students WHERE "userId" = auth.uid();

-- Update basic profile info
-- UPDATE students 
-- SET profile = jsonb_set(profile, '{name}', '"New Name"')
-- WHERE "userId" = auth.uid();

-- Add education record
-- SELECT add_to_profile_array(
--   (SELECT id FROM students WHERE "userId" = auth.uid()),
--   'education',
--   '{"degree": "M.Tech", "university": "MIT", "cgpa": "9.0"}'::jsonb
-- );

-- Update education record
-- SELECT update_profile_array_item(
--   (SELECT id FROM students WHERE "userId" = auth.uid()),
--   'education',
--   1, -- item id
--   '{"cgpa": "9.5"}'::jsonb
-- );

-- Delete education record
-- SELECT delete_from_profile_array(
--   (SELECT id FROM students WHERE "userId" = auth.uid()),
--   'education',
--   1 -- item id
-- );

-- ==================== COMMENTS ====================
COMMENT ON FUNCTION add_to_profile_array IS 'Add a new item to a JSONB array in student profile';
COMMENT ON FUNCTION update_profile_array_item IS 'Update an existing item in a JSONB array';
COMMENT ON FUNCTION delete_from_profile_array IS 'Delete an item from a JSONB array';
