-- Sample data for testing the educator profile
-- Run this after setting up your tables

-- First, let's create a sample school if it doesn't exist
INSERT INTO schools (id, name, address, school_type, is_active) 
VALUES (
  'sample-school-uuid-1234',
  'Sample High School',
  '123 Education Street, Learning City',
  'secondary',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create a sample user in the users table (replace with your actual user ID)
-- You can get your user ID from Supabase Auth or by running: SELECT auth.uid();
INSERT INTO users (id, email, full_name, phone) 
VALUES (
  'your-auth-user-id-here',  -- Replace this with your actual auth user ID
  'educator@example.com',
  'Dr. Jane Smith',
  '+1-555-0123'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

-- Create a sample educator record
INSERT INTO school_educators (
  user_id,
  school_id,
  employee_id,
  specialization,
  qualification,
  experience_years,
  date_of_joining,
  account_status,
  metadata
) VALUES (
  'your-auth-user-id-here',  -- Replace this with your actual auth user ID
  'sample-school-uuid-1234',
  'EMP001',
  'Computer Science',
  'M.Sc. Computer Science, B.Ed.',
  8,
  '2020-09-01',
  'active',
  '{"bio": "Experienced computer science educator with a passion for teaching programming and software development. Specializes in web development, algorithms, and database design."}'::jsonb
) ON CONFLICT (user_id) DO UPDATE SET
  specialization = EXCLUDED.specialization,
  qualification = EXCLUDED.qualification,
  experience_years = EXCLUDED.experience_years,
  metadata = EXCLUDED.metadata;

-- To find your actual user ID, you can run this query when logged in:
-- SELECT auth.uid() as my_user_id;

-- Or check the auth.users table:
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;