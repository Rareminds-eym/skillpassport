-- Step 1: Check if educator data exists for the current user
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,
  specialization,
  qualification,
  experience_years,
  phone_number,
  designation,
  department,
  date_of_joining,
  school_id
FROM public.school_educators
WHERE email = 'karthikeyan@rareminds.in'
LIMIT 1;

-- Step 2: If no data exists, get the user ID first
SELECT id, email FROM auth.users WHERE email = 'karthikeyan@rareminds.in';

-- Step 3: Get a school ID (if you have schools in the database)
SELECT id, name FROM public.schools LIMIT 1;

-- Step 4: Insert/Update educator data
-- Replace USER_ID and SCHOOL_ID with actual values from steps 2 and 3
INSERT INTO public.school_educators (
  user_id,
  school_id,
  first_name,
  last_name,
  email,
  phone_number,
  specialization,
  qualification,
  experience_years,
  designation,
  department,
  date_of_joining,
  employee_id,
  account_status,
  verification_status,
  gender,
  dob,
  address,
  city,
  state,
  country,
  pincode,
  subjects_handled,
  metadata
) VALUES (
  'USER_ID_HERE',
  'SCHOOL_ID_HERE',
  'Karthikeyan',
  'Kumar',
  'karthikeyan@rareminds.in',
  '+91-9876543210',
  'Computer Science',
  'M.Tech Computer Science',
  5,
  'Senior Educator',
  'Computer Science Department',
  '2020-01-15',
  'EMP001',
  'active',
  'Verified',
  'Male',
  '1990-05-15',
  '123 Main Street, Tech Park',
  'Bangalore',
  'Karnataka',
  'India',
  '560001',
  ARRAY['Python', 'JavaScript', 'Data Science', 'Web Development'],
  '{"bio": "Passionate educator with 5+ years of experience in computer science education", "certifications": ["AWS Certified", "Google Cloud Certified"]}'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone_number = EXCLUDED.phone_number,
  specialization = EXCLUDED.specialization,
  qualification = EXCLUDED.qualification,
  experience_years = EXCLUDED.experience_years,
  designation = EXCLUDED.designation,
  department = EXCLUDED.department,
  date_of_joining = EXCLUDED.date_of_joining,
  employee_id = EXCLUDED.employee_id,
  account_status = EXCLUDED.account_status,
  verification_status = EXCLUDED.verification_status,
  gender = EXCLUDED.gender,
  dob = EXCLUDED.dob,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  pincode = EXCLUDED.pincode,
  subjects_handled = EXCLUDED.subjects_handled,
  metadata = EXCLUDED.metadata;

-- Step 5: Verify the data was inserted
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  email,
  specialization,
  qualification,
  experience_years,
  phone_number,
  designation,
  department,
  date_of_joining,
  school_id,
  account_status,
  verification_status
FROM public.school_educators
WHERE email = 'karthikeyan@rareminds.in';
