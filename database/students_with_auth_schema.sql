-- Create students table with auth integration
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  "universityId" text NULL,
  profile jsonb NULL DEFAULT '{}'::jsonb,
  "createdAt" timestamp with time zone NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NULL DEFAULT now(),
  student_id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_userid_key UNIQUE (id),
  CONSTRAINT students_email_key UNIQUE (email),
  CONSTRAINT students_user_id_key UNIQUE (user_id)
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_students_university ON public.students USING btree ("universityId") TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_students_user ON public.students USING btree (id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students USING btree (email) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_students_profile_gin ON public.students USING gin (profile) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_students_profile_name ON public.students USING btree (((profile ->> 'name'::text))) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_students_profile_email ON public.students USING btree (((profile ->> 'email'::text))) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_students_profile_passport_id ON public.students USING btree (((profile ->> 'passportId'::text))) TABLESPACE pg_default;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER set_students_updated_at 
  BEFORE UPDATE ON students 
  FOR EACH ROW 
  EXECUTE FUNCTION update_students_updated_at();

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
-- Students can view their own record
CREATE POLICY "Students can view own profile" ON public.students
  FOR SELECT USING (auth.uid() = user_id);

-- Students can update their own record
CREATE POLICY "Students can update own profile" ON public.students
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow inserting new student records (for registration)
CREATE POLICY "Allow student registration" ON public.students
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.students (user_id, email, profile)
  VALUES (
    NEW.id,
    NEW.email,
    jsonb_build_object(
      'name', COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      'email', NEW.email,
      'createdAt', now()
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create student record when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert sample data (replace with actual user_id from auth.users)
-- This is just for testing - in production, data will be created via the trigger
INSERT INTO public.students (user_id, email, "universityId", profile) VALUES 
(
  '00000000-0000-0000-0000-000000000000', -- Replace with actual auth user ID
  'harrishhari2006@gmail.com',
  'periyar_univ',
  '{
    "_": 576,
    "age": null,
    "name": "HARRISH P",
    "email": "harrishhari2006@gmail.com",
    "nm_id": "asper130c23ug130che007",
    "skill": "Standard Operating Procedures (SOPs) and Documentation Control",
    "course": "Good Manufacturing Practices",
    "training": [
      {
        "id": 1760211148760,
        "course": "DEBUG TEST TRAINING COURSE",
        "status": "ongoing",
        "enabled": false,
        "progress": 75,
        "startDate": "2025-10-11T19:32:28.760Z",
        "instructor": "Test Instructor",
        "description": "Test training description"
      }
    ],
    "education": [
      {
        "id": 1,
        "cgpa": "8.9/10.0",
        "level": "Bachelor''s",
        "degree": "B.Tech Computer Science Engineering",
        "status": "ongoing",
        "department": "Computer Science Engineering",
        "university": "Stanford University",
        "yearOfPassing": "2025"
      },
      {
        "id": 2,
        "cgpa": "9.2/10.0",
        "level": "High School",
        "degree": "High School Diploma",
        "status": "completed",
        "enabled": true,
        "department": "Science Stream",
        "university": "Springfield High School",
        "yearOfPassing": "2021"
      }
    ],
    "experience": [
      {
        "id": 1760211363869,
        "role": "DEBUG TEST ROLE",
        "skills": ["Testing", "Debugging"],
        "company": "Test Company",
        "enabled": false,
        "endDate": "2024-03-31",
        "duration": "3 months",
        "verified": false,
        "startDate": "2024-01-01",
        "description": "Test work experience"
      }
    ],
    "softSkills": [
      {
        "id": 1760211162259,
        "name": "DEBUG TEST SOFT SKILL",
        "type": "communication",
        "level": 3,
        "enabled": false,
        "description": "Test soft skill"
      }
    ],
    "technicalSkills": [
      {
        "id": 1760211160681,
        "icon": "🧪",
        "name": "DEBUG TEST TECHNICAL SKILL",
        "level": 4,
        "enabled": true,
        "category": "Testing",
        "verified": false,
        "description": "Test technical skill"
      }
    ],
    "university": "Periyar University",
    "imported_at": "2025-10-11T02:13:23.824506",
    "branch_field": "B.Sc Chemistry",
    "trainer_name": null,
    "date_of_birth": "-",
    "district_name": "NAMAKKAL",
    "contact_number": 9788990383,
    "alternate_number": null,
    "college_school_name": "THIRUVALLUVAR GOVT. ARTS COLLEGE, RASIPURAM.",
    "registration_number": 62111,
    "contact_number_dial_code": 91
  }'::jsonb
) ON CONFLICT (email) DO NOTHING;