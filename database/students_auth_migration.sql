-- Migration script to add auth integration to existing students table
-- Run this AFTER backing up your data

-- Step 1: Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'user_id') THEN
        ALTER TABLE public.students ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'email') THEN
        ALTER TABLE public.students ADD COLUMN email text;
    END IF;

    -- Add universityId column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'universityId') THEN
        ALTER TABLE public.students ADD COLUMN "universityId" text;
    END IF;

    -- Add createdAt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'createdAt') THEN
        ALTER TABLE public.students ADD COLUMN "createdAt" timestamp with time zone DEFAULT now();
    END IF;

    -- Add updatedAt column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'updatedAt') THEN
        ALTER TABLE public.students ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now();
    END IF;

    -- Add student_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'student_id') THEN
        ALTER TABLE public.students ADD COLUMN student_id uuid DEFAULT gen_random_uuid();
    END IF;
END $$;

-- Step 2: Update existing records to extract email from profile JSONB
UPDATE public.students 
SET email = profile->>'email' 
WHERE email IS NULL AND profile->>'email' IS NOT NULL;

-- Step 2.5: Handle duplicate emails before adding unique constraint
DO $$
DECLARE
    duplicate_count integer;
BEGIN
    -- Check for duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT email, COUNT(*) 
        FROM public.students 
        WHERE email IS NOT NULL 
        GROUP BY email 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate email groups. Cleaning up...', duplicate_count;
        
        -- Keep only the most recent record for each email (based on id or createdAt)
        DELETE FROM public.students 
        WHERE id NOT IN (
            SELECT DISTINCT ON (email) id
            FROM public.students 
            WHERE email IS NOT NULL
            ORDER BY email, COALESCE("createdAt", now()) DESC, id DESC
        ) AND email IS NOT NULL;
        
        RAISE NOTICE 'Duplicate cleanup completed.';
    ELSE
        RAISE NOTICE 'No email duplicates found.';
    END IF;
END $$;

-- Step 3: Add constraints
DO $$
BEGIN
    -- Add unique constraint on email if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'students' AND constraint_name = 'students_email_key') THEN
        ALTER TABLE public.students ADD CONSTRAINT students_email_key UNIQUE (email);
        RAISE NOTICE 'Added unique constraint on email.';
    END IF;

    -- Add unique constraint on user_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_name = 'students' AND constraint_name = 'students_user_id_key') THEN
        ALTER TABLE public.students ADD CONSTRAINT students_user_id_key UNIQUE (user_id);
        RAISE NOTICE 'Added unique constraint on user_id.';
    END IF;
END $$;

-- Step 4: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_students_university ON public.students USING btree ("universityId");
CREATE INDEX IF NOT EXISTS idx_students_user ON public.students USING btree (id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students USING btree (email);
CREATE INDEX IF NOT EXISTS idx_students_profile_gin ON public.students USING gin (profile);
CREATE INDEX IF NOT EXISTS idx_students_profile_name ON public.students USING btree (((profile ->> 'name'::text)));
CREATE INDEX IF NOT EXISTS idx_students_profile_email ON public.students USING btree (((profile ->> 'email'::text)));
CREATE INDEX IF NOT EXISTS idx_students_profile_passport_id ON public.students USING btree (((profile ->> 'passportId'::text)));

-- Step 5: Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS set_students_updated_at ON students;
CREATE TRIGGER set_students_updated_at 
  BEFORE UPDATE ON students 
  FOR EACH ROW 
  EXECUTE FUNCTION update_students_updated_at();

-- Step 7: Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Step 8: Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Students can view own profile" ON public.students;
DROP POLICY IF EXISTS "Students can update own profile" ON public.students;
DROP POLICY IF EXISTS "Allow student registration" ON public.students;

-- Create new RLS Policies for students table
CREATE POLICY "Students can view own profile" ON public.students
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Students can update own profile" ON public.students
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow student registration" ON public.students
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Step 9: Create or replace function to handle new user registration
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
EXCEPTION WHEN unique_violation THEN
  -- If student already exists, just return NEW
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 11: Update the specific user record with the correct user_id
-- First, let's create a test auth user if it doesn't exist (for development only)
-- In production, users will be created through the sign-up process

-- Update existing student record to link with auth user
-- You'll need to replace this with the actual user_id from your auth.users table
DO $$
DECLARE
    auth_user_id uuid;
BEGIN
    -- Try to find existing auth user by email
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'harrishhari2006@gmail.com' 
    LIMIT 1;
    
    IF auth_user_id IS NOT NULL THEN
        -- Update the student record with the auth user_id
        UPDATE public.students 
        SET user_id = auth_user_id,
            email = 'harrishhari2006@gmail.com'
        WHERE profile->>'email' = 'harrishhari2006@gmail.com' 
        AND user_id IS NULL;
        
        RAISE NOTICE 'Updated student record for user_id: %', auth_user_id;
    ELSE
        RAISE NOTICE 'No auth user found for harrishhari2006@gmail.com. User needs to sign up first.';
    END IF;
END $$;

-- Step 12: Verify the migration
SELECT 
    id,
    user_id,
    email,
    profile->>'name' as name,
    "createdAt",
    "updatedAt"
FROM public.students 
LIMIT 5;